"""ClickUp REST v2: project tasks in, mentor support tasks out.

Barabari already runs its projects and support tickets in ClickUp, so this keeps that workflow:
the agent reads live tasks, and an escalation shows up where mentors already look.

Every call here is best-effort from the caller's point of view. The tasks table is the copy the
agent reads, so a ClickUp outage or rate limit (100 requests a minute on the free plan) leaves
the last synced data in place instead of failing an answer.
"""

import logging
import time
from datetime import date, datetime
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.mongo import INTEGRATIONS, get_mongo
from app.models import Task

log = logging.getLogger(__name__)

API = "https://api.clickup.com/api/v2"
SYNC_MAX_AGE_SECONDS = 60
OUR_STATUSES = ("to do", "in progress", "review", "done")

_last_sync: dict[str, float] = {}


class ClickUpError(Exception):
    pass


def enabled() -> bool:
    s = get_settings()
    return bool(s.clickup_enabled and s.clickup_token)


async def _request(method: str, path: str, **kwargs) -> dict:
    # Personal tokens go in the header as-is; "Bearer" is for OAuth tokens only
    headers = {"Authorization": get_settings().clickup_token}
    async with httpx.AsyncClient(base_url=API, headers=headers, timeout=20) as client:
        resp = await client.request(method, path, **kwargs)
    if resp.status_code >= 400:
        raise ClickUpError(f"{method} {path} -> {resp.status_code}: {resp.text[:200]}")
    return resp.json() if resp.content else {}


async def get_config() -> dict:
    """Workspace, space and list ids written by scripts.clickup_setup."""
    return await get_mongo()[INTEGRATIONS].find_one({"_id": "clickup"}) or {}


# --- status mapping -----------------------------------------------------------------------------


def to_clickup_status(ours: str, list_statuses: list[dict]) -> str:
    """Pick the list's status for one of ours. ClickUp rejects names the list does not have."""
    names = {s["status"].lower(): s["status"] for s in list_statuses}
    if ours in names:
        return names[ours]
    if ours == "done":
        closed = [s["status"] for s in list_statuses if s.get("type") in ("closed", "done")]
        return closed[0] if closed else list_statuses[-1]["status"]
    if ours == "review" and "in progress" in names:
        return names["in progress"]
    return list_statuses[0]["status"]


def from_clickup_status(task: dict) -> str:
    """Our status for a ClickUp task. A tag carries any status the list could not express."""
    for tag in task.get("tags", []):
        if tag["name"].lower() in OUR_STATUSES:
            return tag["name"].lower()
    status = task.get("status", {})
    if status.get("type") in ("closed", "done"):
        return "done"
    name = status.get("status", "").lower()
    return name if name in OUR_STATUSES else "to do"


# ClickUp keeps a date-only due date as 4:00 AM in the user's timezone, so the same instant is
# a different calendar day in UTC. Dates are therefore written and read in that timezone.
DEFAULT_TZ = "Asia/Kolkata"


def _due_ms(d: date | None, tz: str = DEFAULT_TZ) -> int | None:
    if d is None:
        return None
    return int(datetime(d.year, d.month, d.day, 4, tzinfo=ZoneInfo(tz)).timestamp() * 1000)


def _due_date(ms: str | None, tz: str = DEFAULT_TZ) -> date | None:
    return datetime.fromtimestamp(int(ms) / 1000, tz=ZoneInfo(tz)).date() if ms else None


# --- reading ------------------------------------------------------------------------------------


async def fetch_tasks(list_id: str) -> list[dict]:
    tasks: list[dict] = []
    page = 0
    while True:
        data = await _request(
            "GET",
            f"/list/{list_id}/task",
            params={"page": page, "include_closed": "true", "subtasks": "true"},
        )
        tasks.extend(data.get("tasks", []))
        if data.get("last_page", True) or not data.get("tasks"):
            return tasks
        page += 1


async def sync_project_tasks(db: AsyncSession, project_id: str, force: bool = False) -> int | None:
    """Mirror a project's ClickUp list into the tasks table.

    Returns the number of tasks synced, or None when skipped (disabled, not set up, still fresh,
    or ClickUp unreachable).
    """
    if not enabled():
        return None
    if not force and time.monotonic() - _last_sync.get(project_id, -1e9) < SYNC_MAX_AGE_SECONDS:
        return None
    config = await get_config()
    list_id = config.get("lists", {}).get(project_id)
    if not list_id:
        return None
    tz = config.get("timezone", DEFAULT_TZ)
    try:
        remote = await fetch_tasks(list_id)
    except (ClickUpError, httpx.HTTPError):
        log.warning("ClickUp sync failed for %s; using the stored tasks", project_id, exc_info=True)
        return None

    existing = {
        t.clickup_id: t
        for t in (await db.execute(select(Task).where(Task.project_id == project_id))).scalars()
        if t.clickup_id
    }
    seen: set[str] = set()
    for r in remote:
        seen.add(r["id"])
        task = existing.get(r["id"])
        if task is None:
            task = Task(id=f"cu-{r['id']}", project_id=project_id, clickup_id=r["id"], name="")
            db.add(task)
        task.name = r["name"]
        task.description = r.get("text_content") or r.get("description") or ""
        task.status = from_clickup_status(r)
        task.due_date = _due_date(r.get("due_date"), tz)
        priority = r.get("priority") or {}
        task.priority = int(priority.get("id") or 3)
    # A task deleted in ClickUp should stop showing up as pending work
    for clickup_id, task in existing.items():
        if clickup_id not in seen:
            await db.delete(task)
    await db.commit()
    _last_sync[project_id] = time.monotonic()
    return len(remote)


# --- writing ------------------------------------------------------------------------------------


async def create_task(list_id: str, *, name: str, description: str = "", **fields) -> dict:
    body = {"name": name, "description": description, **{k: v for k, v in fields.items() if v}}
    return await _request("POST", f"/list/{list_id}/task", json=body)


async def open_support_task(ticket, student_name: str, project_name: str) -> str | None:
    """Put an escalated ticket where mentors already track support. Returns the ClickUp task id."""
    if not enabled():
        return None
    list_id = (await get_config()).get("lists", {}).get("support")
    if not list_id:
        return None
    description = (
        f"Student: {student_name}\nProject: {project_name}\n"
        f"Category: {ticket.category.replace('_', ' ')}\nTicket: {ticket.id}\n\n"
        f"QUESTION\n{ticket.question}\n\n"
        f"WHAT WAS TRIED\n{ticket.tried[:1500]}\n\n"
        f"AI DRAFT ANSWER (approve, edit or rewrite in the mentor dashboard)\n"
        f"{ticket.draft_answer[:3000]}"
    )
    try:
        task = await create_task(
            list_id,
            name=f"{student_name}: {ticket.question[:90]}",
            description=description,
            priority=2,
            tags=[ticket.category.replace("_", "-")],
        )
    except (ClickUpError, httpx.HTTPError):
        log.warning("Could not create a ClickUp task for ticket %s", ticket.id, exc_info=True)
        return None
    await get_mongo()[INTEGRATIONS].update_one(
        {"_id": f"ticket:{ticket.id}"},
        {"$set": {"clickup_task_id": task["id"], "url": task.get("url")}},
        upsert=True,
    )
    return task["id"]


async def close_support_task(ticket_id: str, mentor_name: str, answer: str) -> bool:
    """Record the mentor's answer on the ClickUp task and close it."""
    if not enabled():
        return False
    link = await get_mongo()[INTEGRATIONS].find_one({"_id": f"ticket:{ticket_id}"})
    if not link:
        return False
    task_id = link["clickup_task_id"]
    try:
        await _request(
            "POST",
            f"/task/{task_id}/comment",
            json={"comment_text": f"Answered by {mentor_name}:\n\n{answer}", "notify_all": False},
        )
        task = await _request("GET", f"/task/{task_id}")
        listing = await _request("GET", f"/list/{task['list']['id']}")
        await _request(
            "PUT",
            f"/task/{task_id}",
            json={"status": to_clickup_status("done", listing["statuses"])},
        )
    except (ClickUpError, httpx.HTTPError):
        log.warning("Could not close ClickUp task %s", task_id, exc_info=True)
        return False
    return True
