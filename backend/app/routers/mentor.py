from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.db.mongo import PROJECT_MEMORY, SESSIONS, STUDENT_MEMORY, get_mongo
from app.db.postgres import get_db
from app.models import Project, Ticket, User
from app.services import escalation
from app.services.sessions import deliver_mentor_answer

router = APIRouter(prefix="/api/mentor", tags=["mentor"])


class ResolveIn(BaseModel):
    answer: str


def ticket_out(t: Ticket) -> dict:
    return {
        "id": t.id,
        "kind": t.kind,
        "status": t.status,
        "project_id": t.project_id,
        "student_id": t.student_id,
        "session_id": t.session_id,
        "category": t.category,
        "question": t.question,
        "created_at": t.created_at.isoformat(),
        "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
    }


async def _own_ticket(ticket_id: str, user: User, db: AsyncSession) -> Ticket:
    ticket = await db.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(404, "Unknown ticket")
    if user.role == "mentor" and ticket.mentor_id != user.id:
        raise HTTPException(403, "Not your ticket")
    return ticket


@router.get("/tickets")
async def list_tickets(
    status: str = "open",
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    stmt = select(Ticket).where(Ticket.status == status).order_by(Ticket.created_at.desc())
    if user.role == "mentor":
        stmt = stmt.where(Ticket.mentor_id == user.id)
    return [ticket_out(t) for t in (await db.execute(stmt)).scalars().all()]


@router.get("/tickets/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Everything the mentor needs to answer without asking for context."""
    ticket = await _own_ticket(ticket_id, user, db)
    # The clock for "mentor minutes per ticket" starts the first time the mentor opens it
    if ticket.opened_at is None and user.role == "mentor":
        ticket.opened_at = datetime.now(timezone.utc)
        await db.commit()

    mongo = get_mongo()
    project = await db.get(Project, ticket.project_id)
    student = await db.get(User, ticket.student_id)
    if project is None or student is None:
        raise HTTPException(404, "Ticket refers to a missing project or student")
    memory = await mongo[PROJECT_MEMORY].find_one({"_id": ticket.project_id}) or {}
    student_memory = await mongo[STUDENT_MEMORY].find_one({"_id": ticket.student_id}) or {}
    session = await mongo[SESSIONS].find_one({"_id": ticket.session_id}) or {}

    return {
        **ticket_out(ticket),
        "project": {"id": project.id, "name": project.name, "card": memory.get("card", "")},
        "student": {
            "id": student.id,
            "name": student.name,
            "memory": student_memory.get("markdown", ""),
        },
        "tried": ticket.tried,
        "excerpts": ticket.excerpts,
        "draft_answer": ticket.draft_answer,
        "final_answer": ticket.final_answer,
        "chat": [
            {"role": t["role"], "content": t["content"], "created_at": t["created_at"].isoformat()}
            for t in session.get("turns", [])
        ],
    }


@router.post("/tickets/{ticket_id}/resolve")
async def resolve(
    ticket_id: str,
    body: ResolveIn,
    user: User = Depends(require_role("mentor")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    ticket = await _own_ticket(ticket_id, user, db)
    if ticket.status == "resolved":
        raise HTTPException(409, "Ticket is already resolved")
    if ticket.opened_at is None:
        ticket.opened_at = ticket.created_at
    entry = await escalation.resolve_ticket(db, ticket, body.answer.strip())
    if ticket.kind == "ticket":
        await deliver_mentor_answer(ticket.session_id, user.name, body.answer.strip(), ticket.id)
    return {**ticket_out(ticket), "kb_entry_id": entry.id if entry else None}


@router.get("/metrics")
async def get_metrics(
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await escalation.metrics(db, user.id if user.role == "mentor" else None)
