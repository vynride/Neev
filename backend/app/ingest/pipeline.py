"""Ingest entry points.

uv run python -m app.ingest.pipeline          # all projects
uv run python -m app.ingest.pipeline p1       # one project
"""

import asyncio
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import SessionLocal, init_postgres
from app.ingest import repo
from app.ingest.docs import ingest_project_text
from app.ingest.summaries import build_project_card, build_repo_map
from app.llm.client import get_llm
from app.models import KBEntry, Project

SYNC_MAX_AGE = timedelta(minutes=10)


async def sync_project_repo(db: AsyncSession, project: Project, force: bool = False) -> bool:
    """Fetch the repo if the last sync is stale. Returns True when a fetch happened."""
    if not project.repo_url:
        return False
    now = datetime.now(timezone.utc)
    fresh = project.repo_synced_at and now - project.repo_synced_at < SYNC_MAX_AGE
    if fresh and not force:
        return False
    commit = await repo.sync_repo(project.id, project.repo_url, project.repo_branch)
    await build_repo_map(project.id, commit)
    project.repo_synced_at = now
    await db.commit()
    return True


async def embed_kb(db: AsyncSession) -> int:
    entries = (await db.execute(select(KBEntry).where(KBEntry.embedding.is_(None)))).scalars().all()
    if entries:
        vectors = await get_llm().embed([f"{e.question}\n{e.answer}" for e in entries])
        for entry, vec in zip(entries, vectors, strict=True):
            entry.embedding = vec
        await db.commit()
    return len(entries)


async def ingest_project(db: AsyncSession, project: Project) -> None:
    chunks = await ingest_project_text(db, project.id)
    print(f"{project.id}: {chunks} chunks")
    await build_project_card(project)
    print(f"{project.id}: project card written")
    await sync_project_repo(db, project, force=True)
    print(f"{project.id}: repo synced and mapped")


async def main(only: str | None) -> None:
    await init_postgres()
    async with SessionLocal() as db:
        projects = (await db.execute(select(Project).order_by(Project.id))).scalars().all()
        for project in projects:
            if only and project.id != only:
                continue
            await ingest_project(db, project)
        print(f"KB entries embedded: {await embed_kb(db)}")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else None))
