from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_user, require_role
from app.db.mongo import PROJECT_MEMORY, SESSION_SUMMARIES, STUDENT_MEMORY, get_mongo
from app.db.postgres import get_db
from app.models import Assignment, StudentScore, User
from app.routers.projects import get_project_for
from app.services import memory

router = APIRouter(prefix="/api", tags=["memory"])


class MemoryIn(BaseModel):
    markdown: str = Field(min_length=1, max_length=8000)


async def _can_see_student(user: User, student_id: str, db: AsyncSession) -> None:
    if user.role == "admin" or user.id == student_id:
        return
    if user.role == "mentor":
        stmt = select(Assignment).where(
            Assignment.student_id == student_id, Assignment.mentor_id == user.id
        )
        if (await db.execute(stmt)).first():
            return
    raise HTTPException(403, "Not your student")


@router.get("/students/{student_id}/memory")
async def get_student_memory(
    student_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    await _can_see_student(user, student_id, db)
    doc = await get_mongo()[STUDENT_MEMORY].find_one({"_id": student_id}) or {}
    score = await db.get(StudentScore, student_id)
    return {
        "student_id": student_id,
        "markdown": doc.get("markdown", ""),
        "struggles": doc.get("struggles", {}),
        "edited_by": doc.get("edited_by"),
        "scores": {"codeguru": score.codeguru, "samvad_saathi": score.samvad_saathi}
        if score
        else None,
    }


@router.put("/students/{student_id}/memory")
async def put_student_memory(
    student_id: str,
    body: MemoryIn,
    user: User = Depends(require_role("mentor")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Mentors can correct what the AI believes about a student."""
    await _can_see_student(user, student_id, db)
    await memory.set_student_memory(student_id, body.markdown, editor=user.id)
    return {"student_id": student_id, "edited_by": user.id}


@router.get("/projects/{project_id}/memory")
async def get_project_memory(
    project_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    await get_project_for(user, project_id, db)
    mongo = get_mongo()
    doc = await mongo[PROJECT_MEMORY].find_one({"_id": project_id}) or {}
    summaries = (
        await mongo[SESSION_SUMMARIES]
        .find({"project_id": project_id})
        .sort("created_at", -1)
        .to_list(20)
    )
    if user.role == "student":
        summaries = [s for s in summaries if s["student_id"] == user.id]
    return {
        "project_id": project_id,
        "card": doc.get("card", ""),
        "session_summaries": [
            {
                "session_id": s["_id"],
                "student_id": s["student_id"],
                "summary": s["summary"],
                "created_at": s["created_at"].isoformat(),
            }
            for s in summaries
        ],
    }
