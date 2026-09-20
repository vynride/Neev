"""Load a fortnight of realistic student activity, so the demo does not start empty.

    uv run python -m scripts.demo_activity            # load once
    uv run python -m scripts.demo_activity --force    # remove the demo activity and load it again

It writes chats, tickets (open, resolved and FYI), knowledge base entries from resolved tickets,
metric events and recurring struggles. No model calls are made; only the new knowledge base
entries are embedded. Everything it creates has an id starting with "demo_", so --force removes
exactly that and nothing a person did by hand.
"""

import asyncio
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import delete, func, select

from app.agent.search import embed_or_none
from app.db.mongo import INTEGRATIONS, SESSIONS, get_mongo
from app.db.postgres import SessionLocal, init_postgres
from app.integrations import clickup
from app.models import KBEntry, MetricEvent, Project, Ticket, User
from app.services import memory
from app.services.chat import KB_MESSAGE
from app.services.escalation import mentor_for

DATA = Path(__file__).resolve().parent.parent / "seed_data" / "demo_activity.json"
# Demo metric events carry this microsecond value, which is how --force finds them again
MARK = 424242


def _at(conv: dict, minutes: int = 0) -> datetime:
    now = datetime.now(timezone.utc)
    if conv.get("days_ago"):
        # Earlier days: during the working day in India (from 10:30 IST), not at whatever hour
        # the script happens to run
        day = now - timedelta(days=conv["days_ago"])
        start = day.replace(hour=5, minute=0, second=0) + timedelta(minutes=conv["slot"] * 47)
    else:
        start = now - timedelta(hours=conv.get("hours_ago", 0))
    return (start + timedelta(minutes=minutes)).replace(microsecond=MARK)


async def _clear(db) -> None:
    await get_mongo()[SESSIONS].delete_many({"_id": {"$regex": "^demo_"}})
    await db.execute(delete(KBEntry).where(KBEntry.id.like("demo_%")))
    await db.execute(delete(Ticket).where(Ticket.id.like("demo_%")))
    await db.execute(
        delete(MetricEvent).where(func.to_char(MetricEvent.created_at, "US") == str(MARK))
    )
    await db.commit()


async def _load(db, conv: dict, kb_by_ticket: dict[str, KBEntry]) -> list[str]:
    names = {u.id: u.name for u in (await db.execute(select(User))).scalars()}
    mentor_id = await mentor_for(db, conv["project"], conv["student"])
    spec = conv.get("ticket")
    events: list[tuple[str, datetime]] = []
    turns: list[dict] = []
    question = ""
    clock = 0

    for i, t in enumerate(conv["turns"]):
        clock += 2
        turn = {"id": f"{conv['id']}_m{i}", "created_at": _at(conv, clock), "role": t["role"]}
        if t["role"] == "student":
            question = t["content"]
            turn["content"] = question
            events.append(("question", turn["created_at"]))
        elif t["role"] == "mentor":
            # The mentor opens the ticket a while later and answers within a few minutes
            clock += 35 + spec["minutes_to_answer"]
            turn.update(
                created_at=_at(conv, clock),
                content=spec["final_answer"],
                mentor_name=names[mentor_id],
                ticket_id=spec["id"],
            )
        else:
            citations = t.get("citations", [])
            content = t.get("content", "")
            if t.get("kb_answer"):
                entry = kb_by_ticket[conv["kb_from_ticket"]]
                content = KB_MESSAGE.format(a=entry.answer)
                citations = [{"type": "kb", "ref": entry.id, "snippet": entry.question[:200]}]
                events.append(("kb_hit", turn["created_at"]))
            if t.get("attempt") == 2:
                events.append(("retry", turn["created_at"]))
            if t.get("next_action") == "ask_client":
                events.append(("ask_client", turn["created_at"]))
            turn.update(
                content=content,
                question=question,
                attempt=t.get("attempt", 3 if t.get("next_action") == "escalated" else 1),
                category=t["category"],
                next_action=t["next_action"],
                citations=citations,
                resources=t.get("resources", []),
                draft_client_message=t.get("draft_client_message"),
                excerpts=[
                    {"type": c["type"], "ref": c["ref"], "text": c["snippet"]} for c in citations
                ],
                tool_calls=[],
                resolved=t.get("resolved"),
            )
            if t.get("from_kb"):
                turn["from_kb"] = True
            if t["next_action"] == "escalated":
                turn["ticket_id"] = spec["id"]
        turns.append(turn)

    await get_mongo()[SESSIONS].insert_one(
        {
            "_id": conv["id"],
            "student_id": conv["student"],
            "project_id": conv["project"],
            "created_at": turns[0]["created_at"],
            "updated_at": turns[-1]["created_at"],
            "summarised": True,
            "turns": turns,
        }
    )

    if spec:
        kind = spec.get("kind", "ticket")
        created = next(
            (t["created_at"] for t in turns if t.get("next_action") == "escalated"),
            turns[-1]["created_at"],
        )
        excerpts = [e for t in turns for e in t.get("excerpts", [])]
        ticket = Ticket(
            id=spec["id"],
            kind=kind,
            project_id=conv["project"],
            student_id=conv["student"],
            mentor_id=mentor_id,
            session_id=conv["id"],
            category=spec["category"],
            question=question,
            tried=spec["tried"],
            draft_answer=spec["draft_answer"],
            excerpts=excerpts,
            created_at=created,
        )
        if "final_answer" in spec:
            ticket.status = "resolved"
            ticket.final_answer = spec["final_answer"]
            ticket.opened_at = created + timedelta(minutes=35)
            ticket.resolved_at = ticket.opened_at + timedelta(minutes=spec["minutes_to_answer"])
            entry = KBEntry(
                id=f"demo_kb_{spec['id'][-2:]}",
                category=spec["category"],
                question=question,
                answer=spec["final_answer"],
                source_ticket_id=spec["id"],
                created_at=ticket.resolved_at,
            )
            entry.embedding = await embed_or_none(f"{question}\n{spec['final_answer']}")
            db.add(entry)
            kb_by_ticket[spec["id"]] = entry
        db.add(ticket)
        events.append(("fyi" if kind == "fyi" else "escalated", created))
        await db.flush()

        # Open tickets also go to the mentors' ClickUp list, once
        link = await get_mongo()[INTEGRATIONS].find_one({"_id": f"ticket:{spec['id']}"})
        if kind == "ticket" and ticket.status == "open" and not link:
            project = await db.get(Project, conv["project"])
            await clickup.open_support_task(ticket, names[conv["student"]], project.name)

    for kind, when in events:
        db.add(
            MetricEvent(
                kind=kind, project_id=conv["project"], student_id=conv["student"], created_at=when
            )
        )
    await db.commit()
    return [kind for kind, _ in events]


async def main() -> None:
    force = "--force" in sys.argv
    await init_postgres()
    conversations = json.loads(DATA.read_text())

    async with SessionLocal() as db:
        if await get_mongo()[SESSIONS].find_one({"_id": conversations[0]["id"]}):
            if not force:
                raise SystemExit("Demo activity is already loaded. Use --force to load it again.")
            await _clear(db)

        kb_by_ticket: dict[str, KBEntry] = {}
        counts: dict[str, int] = {}
        # Oldest first, so a reused mentor answer exists before the chat that reuses it
        for slot, conv in enumerate(sorted(conversations, key=lambda c: -c.get("days_ago", 0))):
            conv["slot"] = slot % 8
            for kind in await _load(db, conv, kb_by_ticket):
                counts[kind] = counts.get(kind, 0) + 1
            if conv.get("struggle"):
                category = next(t["category"] for t in conv["turns"] if "category" in t)
                for _ in range(2):
                    await memory.note_struggle(conv["student"], category, conv["struggle"])

    print(f"Loaded {len(conversations)} chats. Events: {counts}")


if __name__ == "__main__":
    asyncio.run(main())
