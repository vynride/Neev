"""Hybrid search over project chunks and the knowledge base.

Keyword (Postgres full-text) and vector (pgvector cosine) rankings are merged with
reciprocal rank fusion. If embeddings are unavailable, keyword search still works.
"""

import logging
import re

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.llm.client import get_llm
from app.models import Chunk, KBEntry

log = logging.getLogger(__name__)

RRF_K = 60
KB_MATCH_THRESHOLD = 0.80  # cosine similarity above which a past mentor answer is reused


def _or_tsquery(query: str) -> str:
    """'how do refunds work' -> 'how | refunds | work'. Natural questions rarely AND-match."""
    words = list(dict.fromkeys(w.lower() for w in re.findall(r"[A-Za-z0-9]+", query) if len(w) > 2))
    return " | ".join(words[:12])


# One question is embedded by the shared answers lookup, the knowledge base search and the
# document search. Remembering recent vectors makes that one call instead of three or four.
_recent_vectors: dict[str, list[float]] = {}
_RECENT_MAX = 256


async def embed_or_none(query: str) -> list[float] | None:
    if not get_settings().openai_api_key:
        return None
    if query in _recent_vectors:
        return _recent_vectors[query]
    try:
        vec = (await get_llm().embed([query]))[0]
        if len(_recent_vectors) >= _RECENT_MAX:
            _recent_vectors.pop(next(iter(_recent_vectors)))
        _recent_vectors[query] = vec
        return vec
    except Exception:  # noqa: BLE001  search must degrade to keyword-only, never fail the answer
        log.warning("Embedding the query failed; using keyword search only", exc_info=True)
        return None


async def search_chunks(db: AsyncSession, project_id: str, query: str, k: int = 6) -> list[Chunk]:
    scores: dict[int, float] = {}
    rows: dict[int, Chunk] = {}

    tsq = _or_tsquery(query)
    if tsq:
        tsv = func.to_tsvector("english", Chunk.text)
        q = func.to_tsquery("english", tsq)
        stmt = (
            select(Chunk)
            .where(
                Chunk.project_id == project_id, Chunk.source_type != "requirement", tsv.op("@@")(q)
            )
            .order_by(func.ts_rank(tsv, q).desc())
            .limit(k * 2)
        )
        for rank, chunk in enumerate((await db.execute(stmt)).scalars().all()):
            rows[chunk.id] = chunk
            scores[chunk.id] = scores.get(chunk.id, 0) + 1 / (RRF_K + rank)

    vec = await embed_or_none(query)
    if vec is not None:
        stmt = (
            select(Chunk)
            .where(
                Chunk.project_id == project_id,
                Chunk.source_type != "requirement",
                Chunk.embedding.is_not(None),
            )
            .order_by(Chunk.embedding.cosine_distance(vec))
            .limit(k * 2)
        )
        for rank, chunk in enumerate((await db.execute(stmt)).scalars().all()):
            rows[chunk.id] = chunk
            scores[chunk.id] = scores.get(chunk.id, 0) + 1 / (RRF_K + rank)

    best = sorted(scores, key=lambda i: scores[i], reverse=True)[:k]
    return [rows[i] for i in best]


async def search_kb(db: AsyncSession, query: str, k: int = 3) -> list[tuple[KBEntry, float]]:
    """Past mentor answers with a similarity score in 0..1 (0 when only keyword-matched)."""
    vec = await embed_or_none(query)
    if vec is not None:
        distance = KBEntry.embedding.cosine_distance(vec)
        stmt = (
            select(KBEntry, distance)
            .where(KBEntry.embedding.is_not(None))
            .order_by(distance)
            .limit(k)
        )
        hits = [(entry, 1 - float(dist)) for entry, dist in (await db.execute(stmt)).all()]
        if hits:
            return hits

    tsq = _or_tsquery(query)
    if not tsq:
        return []
    tsv = func.to_tsvector("english", KBEntry.question + " " + KBEntry.answer)
    q = func.to_tsquery("english", tsq)
    stmt = select(KBEntry).where(tsv.op("@@")(q)).order_by(func.ts_rank(tsv, q).desc()).limit(k)
    return [(entry, 0.0) for entry in (await db.execute(stmt)).scalars().all()]
