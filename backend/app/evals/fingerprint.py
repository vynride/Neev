"""Fingerprint the model, prompt and project source state used by an evaluation."""

import hashlib
import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.prompts import BASE_SYSTEM, CATEGORY_GUIDANCE, CLASSIFY_SYSTEM
from app.config import get_settings
from app.db.mongo import PROJECT_MEMORY, REPO_MAPS, get_mongo
from app.models import Chunk


def make_fingerprint(*, models: dict, prompt: str, sources: list[tuple[str, str]]) -> str:
    payload = {"models": models, "prompt": prompt, "sources": sorted(sources)}
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


async def current_snapshot(db: AsyncSession, project_id: str) -> dict:
    settings = get_settings()
    models = {
        "fast": settings.model_fast,
        "strong": settings.model_strong,
        "embedding": settings.embedding_model,
        "api": settings.llm_api,
    }
    prompt = json.dumps(
        {
            "base": BASE_SYSTEM,
            "classify": CLASSIFY_SYSTEM,
            "categories": CATEGORY_GUIDANCE,
        },
        sort_keys=True,
    )
    sources = list(
        (
            await db.execute(select(Chunk.ref, Chunk.text).where(Chunk.project_id == project_id))
        ).all()
    )
    repo_map = await get_mongo()[REPO_MAPS].find_one({"_id": project_id}) or {}
    project_memory = await get_mongo()[PROJECT_MEMORY].find_one({"_id": project_id}) or {}
    sources.extend(
        [
            ("repo_commit", repo_map.get("commit", "")),
            ("project_card", project_memory.get("card", "")),
        ]
    )
    return {
        "fingerprint": make_fingerprint(models=models, prompt=prompt, sources=sources),
        "models": models,
        "prompt_sha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
        "source_refs": sorted(ref for ref, _ in sources),
    }
