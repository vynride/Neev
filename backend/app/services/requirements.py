"""Mentor-owned requirement versions, published search, and stale-answer invalidation."""

import re
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import delete, func, insert, literal, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.search import _or_tsquery, embed_or_none
from app.config import get_settings
from app.llm.client import get_llm
from app.models import (
    Chunk,
    KBEntry,
    Requirement,
    RequirementVersion,
    SharedAnswer,
    SharedAnswerInvalidation,
    Ticket,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def requirement_ref(requirement: Requirement) -> str:
    return f"req:{requirement.id}:v{requirement.version}"


async def prepare_embedding(content: str) -> list[float] | None:
    """Build the vector before activation; lexical search remains available without a key."""
    if not get_settings().openai_api_key:
        return None
    return (await get_llm().embed([content]))[0]


def select_requirement_hits(
    rows: list[Requirement], query: str, limit: int = 4
) -> list[Requirement]:
    """Select only published records with overlapping content; keep drafts invisible."""
    stop = {"the", "and", "for", "are", "was", "when", "what", "how", "does", "this", "that"}
    terms = {x for x in re.findall(r"[a-z0-9]+", query.lower()) if len(x) > 2 and x not in stop}
    if not terms:
        return []
    ranked = []
    for row in rows:
        if row.status != "published":
            continue
        title = set(re.findall(r"[a-z0-9]+", row.title.lower()))
        body = set(re.findall(r"[a-z0-9]+", row.body.lower()))
        score = 3 * len(terms & title) + len(terms & body)
        if score:
            ranked.append((score, row))
    ranked.sort(key=lambda item: (-item[0], item[1].id))
    return [row for _, row in ranked[:limit]]


async def search_requirements(db: AsyncSession, project_id: str, query: str) -> list[Requirement]:
    """Search current requirement chunks by text and vector, then return published records."""
    if not query.strip():
        return []
    lexical_ids: list[str] = []
    tsq = _or_tsquery(query)
    if tsq:
        tsv = func.to_tsvector("english", Chunk.text)
        q = func.to_tsquery("english", tsq)
        lexical_ids = list(
            (
                await db.execute(
                    select(Chunk.source_id)
                    .where(
                        Chunk.project_id == project_id,
                        Chunk.source_type == "requirement",
                        tsv.op("@@")(q),
                    )
                    .order_by(func.ts_rank(tsv, q).desc())
                    .limit(8)
                )
            )
            .scalars()
            .all()
        )

    vector_ids: list[str] = []
    vec = await embed_or_none(query)
    if vec is not None:
        distance = Chunk.embedding.cosine_distance(vec)
        matches = (
            await db.execute(
                select(Chunk.source_id, distance)
                .where(
                    Chunk.project_id == project_id,
                    Chunk.source_type == "requirement",
                    Chunk.embedding.is_not(None),
                )
                .order_by(distance)
                .limit(8)
            )
        ).all()
        vector_ids = [source_id for source_id, dist in matches if float(dist) <= 0.45]

    ids = list(dict.fromkeys([*lexical_ids, *vector_ids]))
    if not ids:
        return []
    rows = (
        (
            await db.execute(
                select(Requirement).where(
                    Requirement.project_id == project_id,
                    Requirement.status == "published",
                    Requirement.id.in_(ids),
                )
            )
        )
        .scalars()
        .all()
    )
    by_id = {row.id: row for row in rows}
    lexical = select_requirement_hits([by_id[i] for i in lexical_ids if i in by_id], query)
    selected = {row.id for row in lexical}
    return (lexical + [by_id[i] for i in vector_ids if i in by_id and i not in selected])[:4]


async def create_draft(
    db: AsyncSession,
    *,
    project_id: str,
    mentor_id: str,
    title: str,
    body: str,
    effective_date: date | None,
) -> Requirement:
    req = Requirement(
        id=f"req_{uuid.uuid4().hex[:12]}",
        project_id=project_id,
        edited_by=mentor_id,
        draft_title=title,
        draft_body=body,
        draft_effective_date=effective_date,
    )
    db.add(req)
    await db.commit()
    return req


async def save_draft(
    db: AsyncSession,
    req: Requirement,
    *,
    mentor_id: str,
    title: str,
    body: str,
    effective_date: date | None,
    expected_revision: int,
) -> Requirement:
    if req.draft_revision != expected_revision:
        raise ValueError("This draft changed since you opened it. Reload before saving.")
    req.draft_title = title
    req.draft_body = body
    req.draft_effective_date = effective_date
    req.draft_revision += 1
    req.edited_by = mentor_id
    req.updated_at = _now()
    await db.commit()
    return req


async def publish(
    db: AsyncSession, req: Requirement, mentor_id: str, expected_revision: int
) -> Requirement:
    """Activate the draft and replace its search chunk in one Postgres commit."""
    if req.draft_revision != expected_revision:
        raise ValueError("This draft changed since you opened it. Reload before publishing.")
    if not req.draft_title or not req.draft_body:
        raise ValueError("A title and body are required before publishing.")
    title, body = req.draft_title.strip(), req.draft_body.strip()
    if not title or not body:
        raise ValueError("A title and body are required before publishing.")

    content = f"{title}\n{body}"
    embedding = await prepare_embedding(content)
    now = _now()
    version = req.version + 1
    req.title, req.body = title, body
    req.effective_date = req.draft_effective_date
    req.status, req.version = "published", version
    req.published_by, req.published_at, req.updated_at = mentor_id, now, now
    req.draft_title = req.draft_body = None
    req.draft_effective_date = None
    req.draft_revision += 1
    db.add(
        RequirementVersion(
            id=f"rv_{uuid.uuid4().hex[:12]}",
            requirement_id=req.id,
            version=version,
            title=title,
            body=body,
            effective_date=req.effective_date,
            published_by=mentor_id,
            published_at=now,
        )
    )
    await db.execute(
        delete(Chunk).where(Chunk.source_type == "requirement", Chunk.source_id == req.id)
    )
    db.add(
        Chunk(
            project_id=req.project_id,
            source_type="requirement",
            source_id=req.id,
            ref=requirement_ref(req),
            text=content,
            embedding=embedding,
        )
    )
    # KB answers are project-linked through their ticket. Shared answers have no source
    # provenance, so flush that cache conservatively rather than risk stale requirement text.
    ticket_ids = select(Ticket.id).where(Ticket.project_id == req.project_id)
    await db.execute(delete(KBEntry).where(KBEntry.source_ticket_id.in_(ticket_ids)))
    await db.execute(
        insert(SharedAnswerInvalidation).from_select(
            ["answer_id", "requirement_id", "invalidated_at"],
            select(SharedAnswer.id, literal(req.id), literal(now)).where(
                ~SharedAnswer.id.in_(select(SharedAnswerInvalidation.answer_id))
            ),
        )
    )
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return req
