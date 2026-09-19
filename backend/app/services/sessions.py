"""Session logs in MongoDB: the append-only record of each student conversation."""

import uuid
from datetime import datetime, timezone

from app.db.mongo import SESSIONS, get_mongo


def _now() -> datetime:
    return datetime.now(timezone.utc)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


async def get_or_create(session_id: str | None, student_id: str, project_id: str) -> dict:
    coll = get_mongo()[SESSIONS]
    if session_id:
        session = await coll.find_one({"_id": session_id, "student_id": student_id})
        if session:
            return session
    session = {
        "_id": new_id("s"),
        "student_id": student_id,
        "project_id": project_id,
        "created_at": _now(),
        "updated_at": _now(),
        "summarised": False,
        "turns": [],
    }
    await coll.insert_one(session)
    return session


async def append_turn(session_id: str, turn: dict) -> dict:
    turn = {"id": new_id("m"), "created_at": _now(), **turn}
    await get_mongo()[SESSIONS].update_one(
        {"_id": session_id},
        {"$push": {"turns": turn}, "$set": {"updated_at": _now(), "summarised": False}},
    )
    return turn


async def find_turn(message_id: str, student_id: str) -> tuple[dict, dict] | None:
    """The session and the assistant turn with this id, if it belongs to the student."""
    session = await get_mongo()[SESSIONS].find_one(
        {"student_id": student_id, "turns.id": message_id}
    )
    if not session:
        return None
    turn = next(t for t in session["turns"] if t["id"] == message_id)
    return session, turn


async def mark_resolved(session_id: str, message_id: str, resolved: bool) -> None:
    await get_mongo()[SESSIONS].update_one(
        {"_id": session_id, "turns.id": message_id},
        {"$set": {"turns.$.resolved": resolved, "updated_at": _now()}},
    )


def history(session: dict) -> list[dict]:
    """Prior turns in the neutral LLM message format. Mentor replies read as assistant turns."""
    out = []
    for t in session.get("turns", []):
        role = "user" if t["role"] == "student" else "assistant"
        prefix = "[Your mentor replied] " if t["role"] == "mentor" else ""
        out.append({"role": role, "content": prefix + t["content"]})
    return out


async def deliver_mentor_answer(session_id: str, mentor_name: str, answer: str, ticket_id: str):
    await append_turn(
        session_id,
        {"role": "mentor", "content": answer, "mentor_name": mentor_name, "ticket_id": ticket_id},
    )
