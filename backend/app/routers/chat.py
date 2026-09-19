import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_user, require_role
from app.db.mongo import SESSIONS, get_mongo
from app.db.postgres import SessionLocal, get_db
from app.ingest.pipeline import sync_project_repo
from app.ingest.repo import RepoError
from app.models import Project, User
from app.routers.projects import get_project_for
from app.services import chat, memory, sessions

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])


class ChatIn(BaseModel):
    project_id: str
    message: str = Field(min_length=1, max_length=6000)
    session_id: str | None = None


class FeedbackIn(BaseModel):
    resolved: bool


async def _refresh_repo(project_id: str) -> None:
    """Runs after the response is sent, so a stale repo never delays an answer."""
    async with SessionLocal() as db:
        project = await db.get(Project, project_id)
        if project is None:
            return
        try:
            await sync_project_repo(db, project)
        except RepoError:
            log.warning("Repo sync failed for %s", project_id, exc_info=True)


@router.post("/chat")
async def post_chat(
    body: ChatIn,
    background: BackgroundTasks,
    user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    project = await get_project_for(user, body.project_id, db)
    reply = await chat.ask(
        db, student=user, project=project, session_id=body.session_id, message=body.message
    )
    if body.session_id is None:
        # A new session means earlier ones are finished: refresh the code, fold them into memory
        background.add_task(_refresh_repo, project.id)
        background.add_task(memory.summarise_pending, user.id, project.id, reply["session_id"])
    return reply


@router.post("/chat/{message_id}/feedback")
async def post_feedback(
    message_id: str,
    body: FeedbackIn,
    user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    found = await sessions.find_turn(message_id, user.id)
    if found is None:
        raise HTTPException(404, "Unknown message")
    session, turn = found
    if turn["role"] != "assistant" or turn.get("next_action") == "escalated":
        raise HTTPException(400, "Feedback applies to AI mentor answers only")
    project = await get_project_for(user, session["project_id"], db)
    return await chat.feedback(
        db, student=user, project=project, session=session, turn=turn, resolved=body.resolved
    )


def _turn_out(turn: dict, include_trace: bool) -> dict:
    out = {k: v for k, v in turn.items() if k not in {"tool_calls", "excerpts"}}
    out["created_at"] = turn["created_at"].isoformat()
    if include_trace:
        out["tool_calls"] = turn.get("tool_calls", [])
    return out


@router.get("/sessions")
async def list_sessions(project_id: str, user: User = Depends(require_role("student"))) -> list:
    cursor = (
        get_mongo()[SESSIONS]
        .find({"student_id": user.id, "project_id": project_id}, {"turns": {"$slice": 1}})
        .sort("updated_at", -1)
        .limit(30)
    )
    return [
        {
            "id": s["_id"],
            "updated_at": s["updated_at"].isoformat(),
            "first_message": s["turns"][0]["content"][:120] if s.get("turns") else "",
        }
        async for s in cursor
    ]


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    """The session log. Students see their own; mentors also see the tool trace."""
    session = await get_mongo()[SESSIONS].find_one({"_id": session_id})
    if session is None:
        raise HTTPException(404, "Unknown session")
    if user.role == "student" and session["student_id"] != user.id:
        raise HTTPException(403, "Not your session")
    await get_project_for(user, session["project_id"], db)
    return {
        "id": session["_id"],
        "student_id": session["student_id"],
        "project_id": session["project_id"],
        "turns": [_turn_out(t, include_trace=user.role != "student") for t in session["turns"]],
    }
