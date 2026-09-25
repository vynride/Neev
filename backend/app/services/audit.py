"""Durable, full-content operational events for mentor and student state changes."""

import uuid
from datetime import datetime, timezone

from app.db.mongo import AUDIT_EVENTS, get_mongo
from app.services.run_traces import storage_safe


async def record(
    *,
    project_id: str,
    actor_id: str,
    action: str,
    target_id: str,
    before: dict | None = None,
    after: dict | None = None,
) -> str:
    event_id = f"audit_{uuid.uuid4().hex[:16]}"
    await get_mongo()[AUDIT_EVENTS].insert_one(
        {
            "_id": event_id,
            "project_id": project_id,
            "actor_id": actor_id,
            "action": action,
            "target_id": target_id,
            "before": storage_safe(before),
            "after": storage_safe(after),
            "created_at": datetime.now(timezone.utc),
        }
    )
    return event_id
