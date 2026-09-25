"""Mentor-maintained regression cases based on reviewed live runs."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.db.mongo import EVAL_CASES, EVAL_RUNS, RUN_TRACES, get_mongo
from app.db.postgres import get_db
from app.evals.fingerprint import current_snapshot
from app.models import User
from app.routers.projects import get_project_for
from app.services import audit

router = APIRouter(prefix="/api/mentor/evals", tags=["evals"])


class CaseIn(BaseModel):
    expected_refs: list[str] = Field(default_factory=list)
    forbidden_text: list[str] = Field(default_factory=list)
    required_text: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def has_assertion(self):
        self.expected_refs = [value.strip() for value in self.expected_refs if value.strip()]
        self.forbidden_text = [value.strip() for value in self.forbidden_text if value.strip()]
        self.required_text = [value.strip() for value in self.required_text if value.strip()]
        if not any((self.expected_refs, self.forbidden_text, self.required_text)):
            raise ValueError("Add a required citation, required answer phrase, or forbidden phrase")
        return self


@router.get("/cases")
async def list_cases(
    project_id: str,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    await get_project_for(user, project_id, db)
    rows = await get_mongo()[EVAL_CASES].find({"project_id": project_id}).to_list(200)
    current = await current_snapshot(db, project_id)
    return [
        {
            **row,
            "id": row["_id"],
            "source_changed": row.get("baseline_snapshot", {}).get("fingerprint")
            != current["fingerprint"],
        }
        for row in rows
    ]


@router.post("/cases/from-run/{run_id}", status_code=201)
async def create_case(
    run_id: str,
    body: CaseIn,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    run = await get_mongo()[RUN_TRACES].find_one({"_id": run_id})
    if run is None:
        raise HTTPException(404, "Unknown run")
    await get_project_for(user, run["project_id"], db)
    if run.get("review", {}).get("verdict") != "correct" or run.get("review", {}).get(
        "critical_failure"
    ):
        raise HTTPException(409, "Review this run as correct before adding it to the test set")
    case = {
        "_id": f"case_{uuid.uuid4().hex[:12]}",
        "project_id": run["project_id"],
        "student_id": run["actor_id"],
        "question": run["question"],
        "source_trace_id": run_id,
        "expected_refs": body.expected_refs,
        "forbidden_text": body.forbidden_text,
        "required_text": body.required_text,
        "active": True,
        "approved_by": user.id,
        "created_at": datetime.now(timezone.utc),
        "baseline_snapshot": await current_snapshot(db, run["project_id"]),
    }
    await get_mongo()[EVAL_CASES].insert_one(case)
    await audit.record(
        project_id=run["project_id"],
        actor_id=user.id,
        action="evaluation.case_created",
        target_id=case["_id"],
        after=case,
    )
    return {**case, "id": case["_id"]}


@router.put("/cases/{case_id}")
async def update_case(
    case_id: str,
    body: CaseIn,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    coll = get_mongo()[EVAL_CASES]
    case = await coll.find_one({"_id": case_id})
    if case is None:
        raise HTTPException(404, "Unknown case")
    await get_project_for(user, case["project_id"], db)
    new_baseline = await current_snapshot(db, case["project_id"])
    await coll.update_one(
        {"_id": case_id},
        {
            "$set": {
                "expected_refs": body.expected_refs,
                "forbidden_text": body.forbidden_text,
                "required_text": body.required_text,
                "baseline_snapshot": new_baseline,
                "approved_by": user.id,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    await audit.record(
        project_id=case["project_id"],
        actor_id=user.id,
        action="evaluation.case_updated",
        target_id=case_id,
        before={
            "expected_refs": case["expected_refs"],
            "forbidden_text": case["forbidden_text"],
            "required_text": case.get("required_text", []),
        },
        after={
            "expected_refs": body.expected_refs,
            "forbidden_text": body.forbidden_text,
            "required_text": body.required_text,
        },
    )
    return {
        **case,
        "expected_refs": body.expected_refs,
        "forbidden_text": body.forbidden_text,
        "required_text": body.required_text,
        "baseline_snapshot": new_baseline,
        "id": case_id,
    }


@router.get("/latest")
async def latest_eval(
    project_id: str,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict | None:
    await get_project_for(user, project_id, db)
    row = await get_mongo()[EVAL_RUNS].find_one(
        {"project_id": project_id}, sort=[("created_at", -1)]
    )
    if row is None:
        return None
    current = await current_snapshot(db, project_id)
    row["stale"] = (
        row.get("snapshots", {}).get(project_id, {}).get("fingerprint") != current["fingerprint"]
    )
    row["gate_passed"] = row["status"] == "passed" and not row["stale"]
    return {**row, "id": row["_id"]}
