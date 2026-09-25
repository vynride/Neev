"""Turn a project's documents and meeting transcripts into searchable chunks."""

import logging
import re

from openai import OpenAIError
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import DOCUMENTS, MEETINGS, get_mongo
from app.llm.client import get_llm
from app.models import Chunk

log = logging.getLogger(__name__)

SEGMENTS_PER_CHUNK = 6
MAX_CHUNK_CHARS = 1800

_HEADING = re.compile(r"^(#{1,3})\s+(.*)$", re.MULTILINE)


def chunk_markdown(name: str, text: str) -> list[tuple[str, str]]:
    """Split on headings. Returns (ref, text) pairs with refs like 'brief.md#Goals'."""
    marks = list(_HEADING.finditer(text))
    if not marks:
        return [(name, text.strip())] if text.strip() else []
    chunks: list[tuple[str, str]] = []
    preamble = text[: marks[0].start()].strip()
    if preamble:
        chunks.append((name, preamble))
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        body = text[m.start() : end].strip()
        title = m.group(2).strip()
        for part in range(0, len(body), MAX_CHUNK_CHARS):
            chunks.append((f"{name}#{title}", body[part : part + MAX_CHUNK_CHARS]))
    return chunks


def chunk_segments(meeting_id: str, title: str, segments: list[dict]) -> list[tuple[str, str]]:
    """Group speaker turns. Refs look like 'p1-m1@00:01:12' (the first turn's timestamp)."""
    chunks: list[tuple[str, str]] = []
    for i in range(0, len(segments), SEGMENTS_PER_CHUNK):
        group = segments[i : i + SEGMENTS_PER_CHUNK]
        lines = [f"[{s['t']}] {s['speaker']}: {s['text']}" for s in group]
        chunks.append((f"{meeting_id}@{group[0]['t']}", f"Meeting: {title}\n" + "\n".join(lines)))
    return chunks


async def ingest_project_text(db: AsyncSession, project_id: str, embed: bool = True) -> int:
    """Rebuild all chunks for a project. Returns the number of chunks written."""
    mongo = get_mongo()
    rows: list[Chunk] = []

    async for doc in mongo[DOCUMENTS].find({"project_id": project_id}):
        for ref, text in chunk_markdown(doc["name"], doc["text"]):
            rows.append(
                Chunk(
                    project_id=project_id,
                    source_type="doc",
                    source_id=doc["_id"],
                    ref=ref,
                    text=text,
                )
            )

    async for m in mongo[MEETINGS].find({"project_id": project_id, "status": "ended"}):
        for ref, text in chunk_segments(m["_id"], m["title"], m.get("segments", [])):
            rows.append(
                Chunk(
                    project_id=project_id,
                    source_type="meeting",
                    source_id=m["_id"],
                    ref=ref,
                    text=text,
                )
            )

    if embed and rows:
        try:
            vectors = await get_llm().embed([r.text for r in rows])
        except OpenAIError:
            # Chunks without vectors are still found by keyword search
            log.warning("Embedding failed for %s; storing chunks without vectors", project_id)
        else:
            for row, vec in zip(rows, vectors, strict=True):
                row.embedding = vec

    await db.execute(
        delete(Chunk).where(
            Chunk.project_id == project_id, Chunk.source_type.in_(("doc", "meeting"))
        )
    )
    db.add_all(rows)
    await db.commit()
    return len(rows)
