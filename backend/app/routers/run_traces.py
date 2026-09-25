"""Access-checked mentor inspection and review of agent runs."""

import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.db.mongo import AUDIT_EVENTS, RUN_TRACES, get_mongo
from app.db.postgres import get_db
from app.models import User
from app.routers.projects import get_project_for
from app.services import audit
from app.services.run_traces import load_events

router = APIRouter(prefix="/api/mentor/runs", tags=["run-traces"])


class ReviewIn(BaseModel):
    verdict: str
    notes: str = ""
    critical_failure: str | None = None
    expected_reviewed_at: datetime | None = None


def _summary(row: dict) -> dict:
    return {
        "id": row["_id"],
        "project_id": row["project_id"],
        "actor_id": row["actor_id"],
        "question": row["question"],
        "created_at": row["created_at"],
        "outcome": row["outcome"],
        "review": row.get("review"),
        "event_count": row.get("event_count", 0),
    }


@router.get("")
async def list_runs(
    project_id: str,
    q: str = Query(default="", max_length=200),
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    await get_project_for(user, project_id, db)
    match: dict = {"project_id": project_id}
    if q.strip():
        match["question"] = {"$regex": re.escape(q.strip()), "$options": "i"}
    cursor = get_mongo()[RUN_TRACES].find(match).sort("created_at", -1).limit(100)
    return [_summary(row) async for row in cursor]


@router.get("/{run_id}")
async def get_run(
    run_id: str,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    row = await get_mongo()[RUN_TRACES].find_one({"_id": run_id})
    if row is None:
        raise HTTPException(404, "Unknown run")
    await get_project_for(user, row["project_id"], db)
    row["id"] = row.pop("_id")
    row["events"] = await load_events(run_id)
    return row


@router.post("/{run_id}/review")
async def review_run(
    run_id: str,
    body: ReviewIn,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if body.verdict not in {"correct", "incorrect", "uncertain"}:
        raise HTTPException(400, "Invalid verdict")
    if body.critical_failure not in {None, "cross_project_disclosure", "unsupported_requirement"}:
        raise HTTPException(400, "Invalid critical failure")
    if body.critical_failure and body.verdict == "correct":
        raise HTTPException(400, "A critical failure cannot be marked correct")
    coll = get_mongo()[RUN_TRACES]
    row = await coll.find_one({"_id": run_id})
    if row is None:
        raise HTTPException(404, "Unknown run")
    await get_project_for(user, row["project_id"], db)
    review = {
        "verdict": body.verdict,
        "notes": body.notes,
        "critical_failure": body.critical_failure,
        "reviewed_by": user.id,
        "reviewed_at": datetime.now(timezone.utc),
    }
    match = {"_id": run_id}
    if row.get("review"):
        match["review.reviewed_at"] = body.expected_reviewed_at
    else:
        match["review"] = {"$exists": False}
    updated = await coll.update_one(match, {"$set": {"review": review}})
    if updated.matched_count == 0:
        raise HTTPException(409, "This run was reviewed by someone else. Reload before saving.")
    await audit.record(
        project_id=row["project_id"],
        actor_id=user.id,
        action="run.reviewed",
        target_id=run_id,
        before=row.get("review"),
        after=review,
    )
    return review


@router.get("/audit/events")
async def list_audit_events(
    project_id: str,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    await get_project_for(user, project_id, db)
    cursor = (
        get_mongo()[AUDIT_EVENTS].find({"project_id": project_id}).sort("created_at", -1).limit(100)
    )
    return [{**row, "id": row["_id"]} async for row in cursor]
