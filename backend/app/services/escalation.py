"""Tickets, FYIs and the knowledge base: everything that involves the human mentor."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.search import KB_MATCH_THRESHOLD, embed_or_none, search_kb
from app.models import Assignment, KBEntry, MetricEvent, Ticket
from app.services.run_traces import record_event


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


async def record(db: AsyncSession, kind: str, project_id: str, student_id: str) -> None:
    db.add(MetricEvent(kind=kind, project_id=project_id, student_id=student_id))
    await db.commit()
    record_event(
        "metric.recorded", output={"kind": kind, "project_id": project_id, "student_id": student_id}
    )


async def mentor_for(db: AsyncSession, project_id: str, student_id: str) -> str:
    row = await db.get(Assignment, (project_id, student_id))
    if row is None:
        raise LookupError(f"{student_id} is not assigned to {project_id}")
    return row.mentor_id


async def find_kb_match(db: AsyncSession, question: str) -> KBEntry | None:
    """A past mentor answer close enough to reuse instead of opening a new ticket."""
    for entry, similarity in await search_kb(db, question, k=1):
        if similarity >= KB_MATCH_THRESHOLD:
            return entry
    return None


async def create_ticket(
    db: AsyncSession,
    *,
    kind: str,
    project_id: str,
    student_id: str,
    session_id: str,
    category: str,
    question: str,
    tried: str,
    draft_answer: str,
    excerpts: list[dict],
) -> Ticket:
    ticket = Ticket(
        id=_id("fyi" if kind == "fyi" else "tkt"),
        kind=kind,
        project_id=project_id,
        student_id=student_id,
        mentor_id=await mentor_for(db, project_id, student_id),
        session_id=session_id,
        category=category,
        question=question,
        tried=tried,
        draft_answer=draft_answer,
        excerpts=excerpts,
    )
    db.add(ticket)
    db.add(
        MetricEvent(
            kind="fyi" if kind == "fyi" else "escalated",
            project_id=project_id,
            student_id=student_id,
        )
    )
    await db.commit()
    record_event(
        "ticket.created",
        output={
            "id": ticket.id,
            "kind": kind,
            "project_id": project_id,
            "student_id": student_id,
            "mentor_id": ticket.mentor_id,
            "question": question,
            "draft_answer": draft_answer,
            "excerpts": excerpts,
        },
    )
    return ticket


async def resolve_ticket(db: AsyncSession, ticket: Ticket, answer: str) -> KBEntry | None:
    """Close the ticket. A real ticket's answer also becomes a knowledge base entry."""
    ticket.final_answer = answer
    ticket.status = "resolved"
    ticket.resolved_at = datetime.now(timezone.utc)

    entry = None
    if ticket.kind == "ticket":
        entry = KBEntry(
            id=_id("kb"),
            category=ticket.category,
            question=ticket.question,
            answer=answer,
            source_ticket_id=ticket.id,
        )
        entry.embedding = await embed_or_none(f"{ticket.question}\n{answer}")
        db.add(entry)
    await db.commit()
    record_event(
        "ticket.resolved",
        output={"id": ticket.id, "answer": answer, "kb_entry_id": entry.id if entry else None},
    )
    return entry


async def metrics(db: AsyncSession, mentor_id: str | None = None) -> dict:
    rows = await db.execute(select(MetricEvent.kind, func.count()).group_by(MetricEvent.kind))
    counts: dict[str, int] = {kind: n for kind, n in rows.all()}
    questions = counts.get("question", 0)
    escalated = counts.get("escalated", 0)

    stmt = select(Ticket).where(Ticket.kind == "ticket", Ticket.status == "resolved")
    if mentor_id:
        stmt = stmt.where(Ticket.mentor_id == mentor_id)
    resolved = (await db.execute(stmt)).scalars().all()
    minutes = [
        (t.resolved_at - t.opened_at).total_seconds() / 60
        for t in resolved
        if t.opened_at and t.resolved_at
    ]
    return {
        "questions": questions,
        "escalated": escalated,
        "deflection_rate": round(1 - escalated / questions, 3) if questions else None,
        "retries": counts.get("retry", 0),
        "redirected_to_client": counts.get("ask_client", 0),
        "answered_from_kb": counts.get("kb_hit", 0),
        "answered_from_shared": counts.get("shared_hit", 0),
        "fyis": counts.get("fyi", 0),
        "tickets_resolved": len(resolved),
        "mentor_minutes_per_ticket": round(sum(minutes) / len(minutes), 1) if minutes else None,
    }
