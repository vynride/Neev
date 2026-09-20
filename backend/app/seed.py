"""Load seed_data/ into Postgres and MongoDB. Safe to run again: it replaces seeded rows.

    uv run python -m app.seed

Documents and meetings are stored raw here. Chunking, embeddings, project cards and repo
maps are produced by the ingest step, which needs LLM keys.
"""

import asyncio
import json
from datetime import date
from pathlib import Path

from sqlalchemy import delete

from app.db.mongo import DOCUMENTS, MEETINGS, STUDENT_MEMORY, get_mongo, init_mongo
from app.db.postgres import SessionLocal, init_postgres
from app.models import (
    Assignment,
    Chunk,
    KBEntry,
    MetricEvent,
    Project,
    SharedAnswer,
    StudentScore,
    Task,
    Ticket,
    User,
)

SEED_DIR = Path(__file__).resolve().parent.parent / "seed_data"


def load(path: Path):
    return json.loads(path.read_text())


def parse_date(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def initial_student_memory(user: dict) -> str:
    """Starting memory file for a student, derived from their scores."""
    cg = user["scores"]["codeguru"]
    ss = user["scores"]["samvad_saathi"]
    domains = sorted(cg["domains"].items(), key=lambda kv: kv[1], reverse=True)
    strong = [f"{d} ({v})" for d, v in domains if v >= 70]
    weak = [f"{d} ({v})" for d, v in domains if v < 55]
    speech = ", ".join(f"{k} {v}" for k, v in ss["speech"].items())
    return "\n".join(
        [
            f"# {user['name']}",
            "",
            "## Strengths",
            ", ".join(strong) or "None above 70 yet",
            "",
            "## Weak domains",
            ", ".join(weak) or "None below 55",
            "",
            "## Communication",
            f"Samvad Saathi speech scores: {speech}.",
            "",
            "## Recurring struggles",
            "None recorded yet.",
            "",
            "## What works for this student",
            "Not known yet.",
        ]
    )


async def seed() -> None:
    await init_postgres()
    await init_mongo()
    mongo = get_mongo()

    users = load(SEED_DIR / "users.json")
    projects = load(SEED_DIR / "projects.json")
    kb = load(SEED_DIR / "kb.json")

    async with SessionLocal() as db:
        for model in (
            MetricEvent, Ticket, Chunk, KBEntry, SharedAnswer, Task, Assignment, StudentScore
        ):  # fmt: skip
            await db.execute(delete(model))
        await db.execute(delete(Project))
        await db.execute(delete(User))

        for u in users:
            db.add(User(id=u["id"], name=u["name"], email=u["email"], role=u["role"]))
        await db.flush()

        for u in users:
            if u.get("scores"):
                db.add(
                    StudentScore(
                        student_id=u["id"],
                        codeguru=u["scores"]["codeguru"],
                        samvad_saathi=u["scores"]["samvad_saathi"],
                    )
                )

        for p in projects:
            db.add(
                Project(
                    id=p["id"],
                    name=p["name"],
                    client_name=p["client_name"],
                    client_contact=p.get("client_contact", ""),
                    repo_url=p["repo_url"],
                    repo_branch=p.get("repo_branch", "main"),
                    stage=p["stage"],
                    start_date=parse_date(p.get("start_date")),
                    deadline=parse_date(p.get("deadline")),
                    budget_inr=p.get("budget_inr"),
                )
            )
        await db.flush()

        for p in projects:
            for sid in p["student_ids"]:
                db.add(Assignment(project_id=p["id"], student_id=sid, mentor_id=p["mentor_id"]))
            for t in load(SEED_DIR / "projects" / p["id"] / "tasks.json"):
                db.add(
                    Task(
                        id=t["id"],
                        project_id=p["id"],
                        name=t["name"],
                        description=t.get("description", ""),
                        status=t["status"],
                        assignee_id=t.get("assignee_id"),
                        due_date=parse_date(t.get("due_date")),
                        priority=t.get("priority", 3),
                    )
                )

        for entry in kb:
            db.add(
                KBEntry(
                    id=entry["id"],
                    category=entry["category"],
                    question=entry["question"],
                    answer=entry["answer"],
                )
            )
        await db.commit()

    await mongo[DOCUMENTS].delete_many({})
    await mongo[MEETINGS].delete_many({})
    await mongo[STUDENT_MEMORY].delete_many({})

    for p in projects:
        pdir = SEED_DIR / "projects" / p["id"]
        doc_paths = [pdir / "brief.md", *sorted((pdir / "docs").glob("*.md"))]
        for path in doc_paths:
            await mongo[DOCUMENTS].insert_one(
                {
                    "_id": f"{p['id']}:{path.name}",
                    "project_id": p["id"],
                    "name": path.name,
                    "text": path.read_text(),
                }
            )
        for m in load(pdir / "meetings.json"):
            await mongo[MEETINGS].insert_one({"_id": m.pop("id"), "project_id": p["id"], **m})

    for u in users:
        if u.get("scores"):
            await mongo[STUDENT_MEMORY].insert_one(
                {"_id": u["id"], "markdown": initial_student_memory(u)}
            )

    print(f"Seeded {len(users)} users, {len(projects)} projects, {len(kb)} KB entries")


if __name__ == "__main__":
    asyncio.run(seed())
