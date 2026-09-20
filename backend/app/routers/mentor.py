from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.db.mongo import PROJECT_MEMORY, SESSIONS, STUDENT_MEMORY, get_mongo
from app.db.postgres import get_db
from app.integrations import clickup
from app.models import Assignment, MetricEvent, Project, StudentScore, Task, Ticket, User
from app.services import escalation, shared_answers
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
    tickets = (await db.execute(stmt)).scalars().all()
    students = {u.id: u.name for u in (await db.execute(select(User))).scalars()}
    projects = {p.id: p.name for p in (await db.execute(select(Project))).scalars()}
    return [
        {
            **ticket_out(t),
            "student_name": students.get(t.student_id, t.student_id),
            "project_name": projects.get(t.project_id, t.project_id),
        }
        for t in tickets
    ]


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
        # True when the answer under review is one that every student gets
        "shared_review": await shared_answers.is_under_review(db, ticket.id),
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
    answer = body.answer.strip()
    entry = await escalation.resolve_ticket(db, ticket, answer)
    shared = False
    if ticket.kind == "ticket":
        await deliver_mentor_answer(ticket.session_id, user.name, answer, ticket.id)
        shared = await _share_if_general(db, ticket, answer, user.name)
    return {**ticket_out(ticket), "kb_entry_id": entry.id if entry else None, "shared": shared}


async def _share_if_general(db: AsyncSession, ticket: Ticket, answer: str, mentor: str) -> bool:
    """The mentor's answer to a general question is what every later student gets.

    A ticket that reviews a saved answer replaces it. Any other ticket adds a new shared answer
    when the question was a general one.
    """
    if await shared_answers.apply_review(db, ticket.id, answer, mentor):
        return True
    session = await get_mongo()[SESSIONS].find_one({"_id": ticket.session_id}) or {}
    asked = [t for t in session.get("turns", []) if t.get("question") == ticket.question]
    if not any(t.get("scope") == "generic" for t in asked):
        return False
    return await shared_answers.store_mentor_answer(
        db, question=ticket.question, answer=answer, category=ticket.category, mentor_name=mentor
    )


@router.get("/metrics")
async def get_metrics(
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await escalation.metrics(db, user.id if user.role == "mentor" else None)


# --- the mentor's students and projects ----------------------------------------------------------


async def _assignments(user: User, db: AsyncSession) -> list[Assignment]:
    stmt = select(Assignment)
    if user.role == "mentor":
        stmt = stmt.where(Assignment.mentor_id == user.id)
    return list((await db.execute(stmt)).scalars().all())


def _task_counts(tasks: list[Task]) -> dict:
    today = datetime.now(timezone.utc).date()
    done = sum(t.status == "done" for t in tasks)
    return {
        "total": len(tasks),
        "done": done,
        "in_progress": sum(t.status in ("in progress", "review") for t in tasks),
        "overdue": sum(
            t.status != "done" and t.due_date is not None and t.due_date < today for t in tasks
        ),
        "progress": round(100 * done / len(tasks)) if tasks else 0,
    }


def _score_summary(score: StudentScore | None) -> dict | None:
    if score is None:
        return None
    speech = list((score.samvad_saathi or {}).get("speech", {}).values())
    return {
        "codeguru_avg": (score.codeguru or {}).get("monthly_avg"),
        "attendance_pct": (score.codeguru or {}).get("attendance_pct"),
        "speech_avg": round(sum(speech) / len(speech)) if speech else None,
    }


@router.get("/projects")
async def list_projects(
    user: User = Depends(require_role("mentor", "admin")), db: AsyncSession = Depends(get_db)
) -> list[dict]:
    """The mentor's projects with task progress, for the dashboard."""
    assignments = await _assignments(user, db)
    names = {u.id: u.name for u in (await db.execute(select(User))).scalars()}
    out = []
    for project_id in sorted({a.project_id for a in assignments}):
        project = await db.get(Project, project_id)
        if project is None:
            continue
        await clickup.sync_project_tasks(db, project_id)
        tasks = (
            (await db.execute(select(Task).where(Task.project_id == project_id))).scalars().all()
        )
        open_tickets = await db.scalar(
            select(func.count())
            .select_from(Ticket)
            .where(
                Ticket.project_id == project_id, Ticket.status == "open", Ticket.kind == "ticket"
            )
        )
        out.append(
            {
                "id": project.id,
                "name": project.name,
                "client_name": project.client_name,
                "stage": project.stage,
                "deadline": project.deadline.isoformat() if project.deadline else None,
                "students": [
                    {"id": a.student_id, "name": names.get(a.student_id, a.student_id)}
                    for a in assignments
                    if a.project_id == project_id
                ],
                "tasks": _task_counts(list(tasks)),
                "open_tickets": open_tickets or 0,
            }
        )
    return out


async def _event_counts(db: AsyncSession) -> dict[str, dict[str, int]]:
    rows = await db.execute(
        select(MetricEvent.student_id, MetricEvent.kind, func.count()).group_by(
            MetricEvent.student_id, MetricEvent.kind
        )
    )
    counts: dict[str, dict[str, int]] = {}
    for student_id, kind, n in rows.all():
        counts.setdefault(student_id, {})[kind] = n
    return counts


@router.get("/students")
async def list_students(
    user: User = Depends(require_role("mentor", "admin")), db: AsyncSession = Depends(get_db)
) -> list[dict]:
    assignments = await _assignments(user, db)
    events = await _event_counts(db)
    projects = {p.id: p for p in (await db.execute(select(Project))).scalars()}
    memories = {
        d["_id"]: d
        async for d in get_mongo()[STUDENT_MEMORY].find(
            {"_id": {"$in": [a.student_id for a in assignments]}}
        )
    }
    out = []
    for a in sorted(assignments, key=lambda a: a.student_id):
        student = await db.get(User, a.student_id)
        if student is None:
            continue
        tasks = (
            (
                await db.execute(
                    select(Task).where(
                        Task.project_id == a.project_id, Task.assignee_id == a.student_id
                    )
                )
            )
            .scalars()
            .all()
        )
        open_tickets = await db.scalar(
            select(func.count())
            .select_from(Ticket)
            .where(
                Ticket.student_id == a.student_id, Ticket.status == "open", Ticket.kind == "ticket"
            )
        )
        mine = events.get(a.student_id, {})
        struggles = memories.get(a.student_id, {}).get("struggles", {})
        top = sorted(struggles.items(), key=lambda kv: -kv[1]["count"])[:2]
        project = projects.get(a.project_id)
        out.append(
            {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "project": {"id": a.project_id, "name": project.name if project else a.project_id},
                "scores": _score_summary(await db.get(StudentScore, a.student_id)),
                "tasks": _task_counts(list(tasks)),
                "questions": mine.get("question", 0),
                "escalated": mine.get("escalated", 0),
                "open_tickets": open_tickets or 0,
                "struggles": [{"topic": k, "count": v["count"]} for k, v in top],
            }
        )
    return out


@router.get("/students/{student_id}")
async def get_student(
    student_id: str,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """One student: scores, what the AI remembers, their tasks, tickets and recent chats."""
    assignments = [a for a in await _assignments(user, db) if a.student_id == student_id]
    student = await db.get(User, student_id)
    if not assignments or student is None:
        raise HTTPException(404, "Not one of your students")

    score = await db.get(StudentScore, student_id)
    mongo = get_mongo()
    memory = await mongo[STUDENT_MEMORY].find_one({"_id": student_id}) or {}
    projects = []
    for a in assignments:
        project = await db.get(Project, a.project_id)
        tasks = (
            (
                await db.execute(
                    select(Task)
                    .where(Task.project_id == a.project_id, Task.assignee_id == student_id)
                    .order_by(Task.due_date)
                )
            )
            .scalars()
            .all()
        )
        projects.append(
            {
                "id": a.project_id,
                "name": project.name if project else a.project_id,
                "client_name": project.client_name if project else "",
                "counts": _task_counts(list(tasks)),
                "tasks": [
                    {
                        "id": t.id,
                        "name": t.name,
                        "status": t.status,
                        "due_date": t.due_date.isoformat() if t.due_date else None,
                    }
                    for t in tasks
                ],
            }
        )
    tickets = (
        (
            await db.execute(
                select(Ticket)
                .where(Ticket.student_id == student_id)
                .order_by(Ticket.created_at.desc())
                .limit(20)
            )
        )
        .scalars()
        .all()
    )
    sessions = (
        await mongo[SESSIONS]
        .find(
            {"student_id": student_id}, {"turns": {"$slice": 1}, "updated_at": 1, "project_id": 1}
        )
        .sort("updated_at", -1)
        .to_list(15)
    )
    events = (await _event_counts(db)).get(student_id, {})
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "scores": {"codeguru": score.codeguru, "samvad_saathi": score.samvad_saathi}
        if score
        else None,
        "memory": memory.get("markdown", ""),
        "memory_edited_by": memory.get("edited_by"),
        "struggles": [
            {"topic": k, "count": v["count"], "category": v.get("category")}
            for k, v in sorted(memory.get("struggles", {}).items(), key=lambda kv: -kv[1]["count"])
        ],
        "projects": projects,
        "tickets": [ticket_out(t) for t in tickets],
        "sessions": [
            {
                "id": s["_id"],
                "updated_at": s["updated_at"].isoformat(),
                "first_message": s["turns"][0]["content"][:140] if s.get("turns") else "",
            }
            for s in sessions
        ],
        "questions": events.get("question", 0),
        "escalated": events.get("escalated", 0),
        "answered_from_kb": events.get("kb_hit", 0),
    }
