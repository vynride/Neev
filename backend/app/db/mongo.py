from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

_client: AsyncIOMotorClient | None = None


def get_mongo() -> AsyncIOMotorDatabase:
    global _client
    settings = get_settings()
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_url, serverSelectionTimeoutMS=5000)
    return _client[settings.mongo_db]


# Collection names, kept in one place so callers don't hardcode strings
SESSIONS = "sessions"
SESSION_SUMMARIES = "session_summaries"
STUDENT_MEMORY = "student_memory"
PROJECT_MEMORY = "project_memory"
MEETINGS = "meetings"
DOCUMENTS = "documents"
REPO_MAPS = "repo_maps"
INTEGRATIONS = "integrations"  # ids of things we created in ClickUp
RUN_TRACES = "run_traces"
RUN_TRACE_EVENTS = "run_trace_events"
EVAL_CASES = "eval_cases"
EVAL_RUNS = "eval_runs"
AUDIT_EVENTS = "audit_events"


async def init_mongo() -> None:
    db = get_mongo()
    await db[SESSIONS].create_index([("student_id", 1), ("project_id", 1), ("updated_at", -1)])
    await db[SESSION_SUMMARIES].create_index([("student_id", 1), ("project_id", 1)])
    await db[MEETINGS].create_index([("project_id", 1), ("started_at", -1)])
    await db[DOCUMENTS].create_index([("project_id", 1)])
    await db[RUN_TRACES].create_index([("project_id", 1), ("created_at", -1)])
    await db[RUN_TRACES].create_index([("actor_id", 1), ("created_at", -1)])
    await db[RUN_TRACE_EVENTS].create_index([("trace_id", 1), ("sequence", 1)])
    await db[EVAL_CASES].create_index([("project_id", 1), ("active", 1)])
    await db[EVAL_RUNS].create_index([("created_at", -1)])
    await db[AUDIT_EVENTS].create_index([("project_id", 1), ("created_at", -1)])
