"""Full-content run records with trace/span identifiers for later OTel export."""

import uuid
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import asdict, dataclass, field, is_dataclass
from datetime import date, datetime, timezone
from typing import Any, Iterator

from app.db.mongo import RUN_TRACE_EVENTS, RUN_TRACES, get_mongo


def _now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class RunTrace:
    project_id: str
    actor_id: str
    question: str
    trace_id: str = field(default_factory=lambda: uuid.uuid4().hex)
    created_at: datetime = field(default_factory=_now)
    events: list[dict[str, Any]] = field(default_factory=list)
    session_id: str | None = None
    message_id: str | None = None
    outcome: str = "started"
    error: str | None = None

    def document(self) -> dict:
        return {
            "_id": self.trace_id,
            "trace_id": self.trace_id,
            "project_id": self.project_id,
            "actor_id": self.actor_id,
            "question": self.question,
            "created_at": self.created_at,
            "session_id": self.session_id,
            "message_id": self.message_id,
            "outcome": self.outcome,
            "error": self.error,
            "event_count": len(self.events),
        }


_current: ContextVar[RunTrace | None] = ContextVar("run_trace", default=None)


def storage_safe(value: Any) -> Any:
    if is_dataclass(value) and not isinstance(value, type):
        return storage_safe(asdict(value))
    if isinstance(value, dict):
        return {str(key): storage_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [storage_safe(item) for item in value]
    if isinstance(value, date) and not isinstance(value, datetime):
        return value.isoformat()
    if value is None or isinstance(value, (str, int, float, bool, datetime)):
        return value
    return repr(value)


def current_run() -> RunTrace | None:
    return _current.get()


@contextmanager
def use_run(run: RunTrace) -> Iterator[RunTrace]:
    token = _current.set(run)
    try:
        yield run
    finally:
        _current.reset(token)


def record_event(
    name: str, *, input: Any = None, output: Any = None, attributes: dict | None = None
) -> None:
    run = current_run()
    if run is None:
        return
    run.events.append(
        {
            "span_id": uuid.uuid4().hex[:16],
            "name": name,
            "timestamp": _now(),
            "input": storage_safe(input),
            "output": storage_safe(output),
            "attributes": storage_safe(attributes or {}),
        }
    )


async def persist(run: RunTrace) -> None:
    mongo = get_mongo()
    for start in range(0, len(run.events), 100):
        batch = [
            {
                "_id": f"{run.trace_id}:{index}",
                "trace_id": run.trace_id,
                "sequence": index,
                **run.events[index],
            }
            for index in range(start, min(start + 100, len(run.events)))
        ]
        await mongo[RUN_TRACE_EVENTS].insert_many(batch)
    await mongo[RUN_TRACES].insert_one(run.document())


async def load_events(trace_id: str) -> list[dict]:
    cursor = get_mongo()[RUN_TRACE_EVENTS].find({"trace_id": trace_id}).sort("sequence", 1)
    return [
        {k: v for k, v in row.items() if k not in {"_id", "trace_id", "sequence"}}
        async for row in cursor
    ]
