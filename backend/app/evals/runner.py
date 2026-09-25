"""Replay mentor-approved questions. Exit nonzero on critical failures."""

import argparse
import asyncio
import json
import sys
import uuid
from datetime import datetime, timezone

from app.agent import mentor
from app.config import get_settings
from app.db.mongo import EVAL_CASES, EVAL_RUNS, get_mongo
from app.db.postgres import SessionLocal, engine
from app.evals.fingerprint import current_snapshot
from app.models import Project
from app.services.run_traces import RunTrace, persist, record_event, use_run


def evaluate_reply(case: dict, reply: mentor.MentorReply) -> dict:
    cited = {c.get("ref") for c in reply.citations}
    missing = sorted(set(case.get("expected_refs", [])) - cited)
    forbidden = [
        text
        for text in case.get("forbidden_text", [])
        if text and text.lower() in reply.message.lower()
    ]
    missing_text = [
        text
        for text in case.get("required_text", [])
        if text and text.lower() not in reply.message.lower()
    ]
    failures = []
    if missing:
        failures.append("unsupported_requirement")
    if forbidden:
        failures.append("cross_project_disclosure")
    if missing_text:
        failures.append("answer_regression")
    return {
        "passed": not failures,
        "critical_failures": failures,
        "missing_refs": missing,
        "forbidden_matches": forbidden,
        "missing_text": missing_text,
    }


async def run_cases(project_id: str | None = None) -> dict:
    match: dict = {"active": True}
    if project_id:
        match["project_id"] = project_id
    cases = await get_mongo()[EVAL_CASES].find(match).to_list(None)
    if not cases:
        return {"status": "no_cases", "passed": 0, "failed": 0, "results": []}
    results = []
    snapshots: dict[str, dict] = {}
    async with SessionLocal() as db:
        for case in cases:
            project = await db.get(Project, case["project_id"])
            if project is None:
                results.append(
                    {
                        "case_id": case["_id"],
                        "passed": False,
                        "critical_failures": ["missing_project"],
                    }
                )
                continue
            if project.id not in snapshots:
                snapshots[project.id] = await current_snapshot(db, project.id)
            trace = RunTrace(
                project_id=project.id, actor_id=case["student_id"], question=case["question"]
            )
            with use_run(trace):
                try:
                    reply = await mentor.answer(
                        db,
                        project=project,
                        student_id=case["student_id"],
                        message=case["question"],
                        history=[],
                    )
                    result = evaluate_reply(case, reply)
                    result.update(
                        {
                            "case_id": case["_id"],
                            "trace_id": trace.trace_id,
                            "answer": reply.message,
                            "citations": reply.citations,
                        }
                    )
                    trace.outcome = "passed" if result["passed"] else "failed"
                    record_event("evaluation.result", output=result)
                except Exception as exc:
                    result = {
                        "case_id": case["_id"],
                        "trace_id": trace.trace_id,
                        "passed": False,
                        "critical_failures": ["execution_error"],
                        "error": repr(exc),
                    }
                    trace.outcome, trace.error = "error", repr(exc)
                await persist(trace)
                results.append(result)
    failed = sum(not row["passed"] for row in results)
    run = {
        "_id": f"eval_{uuid.uuid4().hex[:12]}",
        "created_at": datetime.now(timezone.utc),
        "model_fast": get_settings().model_fast,
        "model_strong": get_settings().model_strong,
        "project_id": project_id,
        "passed": len(results) - failed,
        "failed": failed,
        "status": "blocked" if failed else "passed",
        "snapshots": snapshots,
        "results": results,
    }
    await get_mongo()[EVAL_RUNS].insert_one(run)
    return {**run, "id": run["_id"]}


async def _main() -> int:
    parser = argparse.ArgumentParser(description="Run the mentor regression set")
    parser.add_argument("--project")
    args = parser.parse_args()
    try:
        result = await run_cases(args.project)
        print(json.dumps(result, default=str, indent=2))
        return 0 if result["status"] == "passed" else 1
    finally:
        await engine.dispose()


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
