"""LLM-written summaries produced at ingest: the project card and the repo map."""

import json
from datetime import datetime, timezone

from app.config import get_settings
from app.db.mongo import DOCUMENTS, MEETINGS, PROJECT_MEMORY, REPO_MAPS, get_mongo
from app.ingest import repo
from app.llm.client import get_llm
from app.models import Project

CARD_SYSTEM = """You write a project card for an AI mentor that supports a junior freelance
developer. Use only facts from the material given. If something is not stated, write
"Not specified". Keep it under 450 words, in markdown, with exactly these sections:
## Goals
## Deliverables
## Deadlines and milestones
## Decisions made
## Open questions for the client
## Client preferences
## Agreed scope and what is out of scope
Under "Open questions for the client", list requirements the client left vague or unresolved."""

FILES_SYSTEM = """For each file, write one line (max 18 words) saying what it does in this codebase.
Be specific: name the feature, route, model or component. Do not guess beyond the content shown."""

FILES_SCHEMA = {
    "name": "file_purposes",
    "schema": {
        "type": "object",
        "properties": {
            "files": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {"path": {"type": "string"}, "purpose": {"type": "string"}},
                    "required": ["path", "purpose"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["files"],
        "additionalProperties": False,
    },
}

ARCH_SYSTEM = """Describe this codebase's architecture for a junior developer joining the project.
Use only the file list and excerpts given. Under 300 words, markdown. Cover: stack, how the
frontend and backend are split, main data models, auth approach, third-party services,
how it is configured and deployed. Name the key files for each point."""

HEAD_LINES = 40
BATCH = 15


async def build_project_card(project: Project) -> str:
    mongo = get_mongo()
    parts = [
        f"Project: {project.name}\nClient: {project.client_name} ({project.client_contact})\n"
        f"Stage: {project.stage}\nStart: {project.start_date}\nDeadline: {project.deadline}"
    ]
    async for doc in mongo[DOCUMENTS].find({"project_id": project.id}):
        parts.append(f"# Document: {doc['name']}\n{doc['text']}")
    async for m in (
        mongo[MEETINGS].find({"project_id": project.id, "status": "ended"}).sort("started_at", 1)
    ):
        lines = "\n".join(f"{s['speaker']}: {s['text']}" for s in m.get("segments", []))
        parts.append(f"# Meeting: {m['title']} ({m['started_at']})\n{lines}")

    result = await get_llm().complete(
        model=get_settings().model_strong,
        system=CARD_SYSTEM,
        messages=[{"role": "user", "content": "\n\n".join(parts)}],
        effort="low",
        max_output_tokens=2000,
    )
    card = result.text.strip()
    await mongo[PROJECT_MEMORY].update_one(
        {"_id": project.id},
        {
            "$set": {"card": card, "card_updated_at": datetime.now(timezone.utc)},
            "$setOnInsert": {"decisions_log": [], "open_client_questions": []},
        },
        upsert=True,
    )
    return card


async def build_repo_map(project_id: str, commit: str) -> dict:
    """Describe each file once. On later syncs only files whose hash changed are re-described."""
    mongo = get_mongo()
    llm = get_llm()
    settings = get_settings()

    existing = await mongo[REPO_MAPS].find_one({"_id": project_id}) or {}
    known = {f["path"]: f for f in existing.get("files", [])}

    files = repo.walk_files(project_id)
    root = repo.repo_root(project_id)
    todo = [f for f in files if known.get(f.path, {}).get("sha") != f.sha]

    purposes: dict[str, str] = {}
    for i in range(0, len(todo), BATCH):
        batch = todo[i : i + BATCH]
        blocks = []
        for f in batch:
            head = "\n".join(repo._read_text(root, f.path).splitlines()[:HEAD_LINES])
            blocks.append(f"### {f.path}\n{head}")
        result = await llm.complete(
            model=settings.model_fast,
            system=FILES_SYSTEM,
            messages=[{"role": "user", "content": "\n\n".join(blocks)}],
            json_schema=FILES_SCHEMA,
            effort="low",
            max_output_tokens=3000,
        )
        try:
            for item in json.loads(result.text)["files"]:
                purposes[item["path"]] = item["purpose"]
        except (json.JSONDecodeError, KeyError):
            continue  # files in this batch keep an empty purpose; the agent can still read them

    entries = [
        {
            "path": f.path,
            "lines": f.lines,
            "sha": f.sha,
            "purpose": purposes.get(f.path) or known.get(f.path, {}).get("purpose", ""),
        }
        for f in files
    ]

    architecture = existing.get("architecture", "")
    if todo or not architecture:
        listing = "\n".join(f"{e['path']}: {e['purpose']}" for e in entries)
        extras = []
        for name in (
            "README.md",
            "package.json",
            "backend/package.json",
            "server/package.json",
            "frontend/package.json",
            "client/package.json",
        ):
            if any(e["path"] == name for e in entries):
                extras.append(f"### {name}\n{repo._read_text(root, name)[:3000]}")
        result = await llm.complete(
            model=settings.model_strong,
            system=ARCH_SYSTEM,
            messages=[{"role": "user", "content": listing + "\n\n" + "\n\n".join(extras)}],
            effort="low",
            max_output_tokens=1500,
        )
        architecture = result.text.strip()

    doc = {
        "commit": commit,
        "files": entries,
        "architecture": architecture,
        "updated_at": datetime.now(timezone.utc),
    }
    await mongo[REPO_MAPS].update_one({"_id": project_id}, {"$set": doc}, upsert=True)
    return doc
