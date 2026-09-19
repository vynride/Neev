"""The escalation sequence: answer, clarify, redirect to client, retry, escalate.

A question reaches the mentor only after one failed retry, or when the student asks for a
human. Before a ticket is opened, the knowledge base is checked for a past mentor answer.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.agent import mentor
from app.agent.mentor import MentorReply
from app.models import Project, User
from app.services import escalation, memory, sessions

ESCALATED_MESSAGE = (
    "I have sent this to your mentor, {mentor}, with your question, what we tried and the "
    "relevant project context, so you will not need to explain it again. "
    "Their reply will appear here in this chat."
)
KB_MESSAGE = "Your mentor answered a very similar question before. Here is what they said:\n\n{a}"


def _response(session_id: str, turn: dict, reply: MentorReply | None, **overrides) -> dict:
    base = {
        "session_id": session_id,
        "message_id": turn["id"],
        "category": reply.category if reply else turn.get("category"),
        "scope": reply.scope if reply else turn.get("scope"),
        "next_action": reply.next_action if reply else "answered",
        "message": turn["content"],
        "citations": reply.citations if reply else [],
        "resources": reply.resources if reply else [],
        "draft_client_message": reply.draft_client_message if reply else None,
        "ticket_id": None,
        "grounded": reply.grounded if reply else False,
        "attempt": turn.get("attempt", 1),
    }
    base.update(overrides)
    return base


async def _save_reply(session_id: str, question: str, reply: MentorReply, attempt: int) -> dict:
    return await sessions.append_turn(
        session_id,
        {
            "role": "assistant",
            "content": reply.message,
            "question": question,
            "attempt": attempt,
            "category": reply.category,
            "scope": reply.scope,
            "next_action": reply.next_action,
            "citations": reply.citations,
            "resources": reply.resources,
            "draft_client_message": reply.draft_client_message,
            "struggle_topic": reply.struggle_topic,
            "excerpts": reply.excerpts,
            "tool_calls": reply.tool_calls,
            "resolved": None,
        },
    )


async def _escalate(
    db: AsyncSession,
    *,
    student: User,
    project: Project,
    session_id: str,
    question: str,
    category: str,
    tried: str,
    draft_answer: str,
    excerpts: list[dict],
) -> dict:
    """Reuse a past mentor answer if one is close enough, otherwise open a ticket."""
    match = await escalation.find_kb_match(db, question)
    if match:
        await escalation.record(db, "kb_hit", project.id, student.id)
        turn = await sessions.append_turn(
            session_id,
            {
                "role": "assistant",
                "content": KB_MESSAGE.format(a=match.answer),
                "question": question,
                "attempt": 3,
                "category": category,
                "next_action": "answered",
                "resolved": None,
            },
        )
        citation = {"type": "kb", "ref": match.id, "snippet": match.question[:200]}
        return _response(
            session_id, turn, None, category=category, citations=[citation], grounded=True
        )

    ticket = await escalation.create_ticket(
        db,
        kind="ticket",
        project_id=project.id,
        student_id=student.id,
        session_id=session_id,
        category=category,
        question=question,
        tried=tried,
        draft_answer=draft_answer,
        excerpts=excerpts,
    )
    mentor_user = await db.get(User, ticket.mentor_id)
    text = ESCALATED_MESSAGE.format(mentor=mentor_user.name if mentor_user else "your mentor")
    turn = await sessions.append_turn(
        session_id,
        {
            "role": "assistant",
            "content": text,
            "question": question,
            "attempt": 3,
            "category": category,
            "next_action": "escalated",
            "ticket_id": ticket.id,
        },
    )
    return _response(
        session_id, turn, None, category=category, next_action="escalated", ticket_id=ticket.id
    )


async def ask(
    db: AsyncSession,
    *,
    student: User,
    project: Project,
    session_id: str | None,
    message: str,
    voice: bool = False,
    extra_context: str | None = None,
) -> dict:
    session = await sessions.get_or_create(session_id, student.id, project.id)
    history = sessions.history(session)
    await sessions.append_turn(session["_id"], {"role": "student", "content": message})
    await escalation.record(db, "question", project.id, student.id)

    reply = await mentor.answer(
        db,
        project=project,
        student_id=student.id,
        message=message,
        history=history,
        voice=voice,
        extra_context=extra_context,
    )

    if reply.sensitive:
        await escalation.create_ticket(
            db,
            kind="fyi",
            project_id=project.id,
            student_id=student.id,
            session_id=session["_id"],
            category=reply.category,
            question=message,
            tried=reply.sensitive_reason or "Sensitive topic",
            draft_answer=reply.message,
            excerpts=reply.excerpts,
        )

    if reply.wants_human or reply.next_action == "escalate":
        await _save_reply(session["_id"], message, reply, attempt=1)
        return await _escalate(
            db,
            student=student,
            project=project,
            session_id=session["_id"],
            question=message,
            category=reply.category,
            tried="The student asked for their mentor."
            if reply.wants_human
            else "The AI mentor judged that this needs a mentor's decision or access.",
            draft_answer=reply.message,
            excerpts=reply.excerpts,
        )

    if reply.next_action == "ask_client":
        await escalation.record(db, "ask_client", project.id, student.id)
    if reply.struggle_topic:
        await memory.note_struggle(student.id, reply.category, reply.struggle_topic)

    turn = await _save_reply(session["_id"], message, reply, attempt=1)
    return _response(session["_id"], turn, reply)


async def feedback(
    db: AsyncSession, *, student: User, project: Project, session: dict, turn: dict, resolved: bool
) -> dict:
    await sessions.mark_resolved(session["_id"], turn["id"], resolved)
    if resolved:
        return {"session_id": session["_id"], "message_id": turn["id"], "next_action": "resolved"}

    question = turn.get("question", "")
    if turn.get("attempt", 1) == 1:
        await escalation.record(db, "retry", project.id, student.id)
        # History up to, but not including, the question being retried
        prior = [t for t in session["turns"] if t["created_at"] < turn["created_at"]]
        if prior and prior[-1]["role"] == "student":
            prior = prior[:-1]
        reply = await mentor.answer(
            db,
            project=project,
            student_id=student.id,
            message=question,
            history=sessions.history({"turns": prior}),
            previous_answer=turn["content"],
        )
        retry_turn = await _save_reply(session["_id"], question, reply, attempt=2)
        return _response(session["_id"], retry_turn, reply)

    first = next(
        (t for t in session["turns"] if t.get("question") == question and t.get("attempt") == 1),
        None,
    )
    tried = "The AI mentor answered twice and the student marked both as not resolving it."
    if first:
        tried += f"\n\nFirst attempt:\n{first['content'][:1200]}"
    tried += f"\n\nSecond attempt:\n{turn['content'][:1200]}"
    return await _escalate(
        db,
        student=student,
        project=project,
        session_id=session["_id"],
        question=question,
        category=turn.get("category") or "development_debugging",
        tried=tried,
        draft_answer=turn["content"],
        excerpts=turn.get("excerpts", []),
    )
