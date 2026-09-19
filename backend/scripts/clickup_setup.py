"""Create the demo space and lists in ClickUp and push the seeded tasks into them.

    uv run python -m scripts.clickup_setup

Safe to run again: it reuses the space and lists it finds by name, and skips a list that
already has tasks. Ids are saved in MongoDB, so nothing is hard-coded.
"""

import asyncio
import json
from pathlib import Path

from sqlalchemy import select, update

from app.db.mongo import INTEGRATIONS, get_mongo
from app.db.postgres import SessionLocal, init_postgres
from app.integrations import clickup
from app.models import Project, Task, User

SPACE_NAME = "Barabari Mentor Demo"
SUPPORT_LIST = "Mentor support"
SEED = Path(__file__).resolve().parent.parent / "seed_data" / "projects"


async def find_or_create_space(team_id: str) -> dict:
    spaces = (await clickup._request("GET", f"/team/{team_id}/space"))["spaces"]
    for s in spaces:
        if s["name"] == SPACE_NAME:
            return s
    return await clickup._request(
        "POST",
        f"/team/{team_id}/space",
        json={
            "name": SPACE_NAME,
            "multiple_assignees": False,
            "features": {
                "due_dates": {"enabled": True, "start_date": False, "remap_due_dates": False},
                "priorities": {"enabled": True},
                "tags": {"enabled": True},
            },
        },
    )


async def find_or_create_list(space_id: str, name: str, content: str) -> dict:
    lists = (await clickup._request("GET", f"/space/{space_id}/list"))["lists"]
    for item in lists:
        if item["name"] == name:
            return item
    return await clickup._request(
        "POST", f"/space/{space_id}/list", json={"name": name, "content": content}
    )


async def promote_tagged(tasks: list[dict], statuses: list[dict]) -> int:
    """A new space only has 'to do' and 'complete', so other statuses are pushed as tags.

    Once someone adds 'in progress' or 'review' to the space, this turns those tags into real
    statuses so the board columns look right.
    """
    names = {s["status"].lower() for s in statuses}
    promoted = 0
    for t in tasks:
        for tag in t.get("tags", []):
            name = tag["name"].lower()
            if name in clickup.OUR_STATUSES and name in names:
                await clickup._request("PUT", f"/task/{t['id']}", json={"status": name})
                await clickup._request("DELETE", f"/task/{t['id']}/tag/{name}")
                promoted += 1
    return promoted


async def main() -> None:
    if not clickup.enabled():
        raise SystemExit("Set CLICKUP_TOKEN and CLICKUP_ENABLED=true in backend/.env first.")
    await init_postgres()

    team = (await clickup._request("GET", "/team"))["teams"][0]
    tz = (await clickup._request("GET", "/user"))["user"].get("timezone") or clickup.DEFAULT_TZ
    space = await find_or_create_space(team["id"])
    print(f"Workspace {team['name']} | space {space['name']} ({space['id']})")

    lists: dict[str, str] = {}
    async with SessionLocal() as db:
        projects = (await db.execute(select(Project).order_by(Project.id))).scalars().all()
        names = {u.id: u.name for u in (await db.execute(select(User))).scalars()}

        for project in projects:
            item = await find_or_create_list(
                space["id"], project.name, f"Client: {project.client_name}. Stage: {project.stage}."
            )
            lists[project.id] = item["id"]
            statuses = (await clickup._request("GET", f"/list/{item['id']}"))["statuses"]
            existing = await clickup.fetch_tasks(item["id"])
            if existing:
                promoted = await promote_tagged(existing, statuses)
                print(f"  {project.name}: already has tasks; {promoted} tags became statuses")
                continue

            available = {s["status"].lower() for s in statuses}
            seeded = json.loads((SEED / project.id / "tasks.json").read_text())
            for t in seeded:
                assignee = names.get(t.get("assignee_id"), "Unassigned")
                # The student accounts are not ClickUp members, so the assignee is kept in the text
                created = await clickup.create_task(
                    item["id"],
                    name=t["name"],
                    description=f"{t.get('description', '')}\n\nAssignee: {assignee}",
                    status=clickup.to_clickup_status(t["status"], statuses),
                    priority=t.get("priority"),
                    due_date=clickup._due_ms(clickup.date.fromisoformat(t["due_date"]), tz)
                    if t.get("due_date")
                    else None,
                    tags=[] if t["status"] in available or t["status"] == "done" else [t["status"]],
                )
                await db.execute(
                    update(Task).where(Task.id == t["id"]).values(clickup_id=created["id"])
                )
            await db.commit()
            print(f"  {project.name}: pushed {len(seeded)} tasks")

    support = await find_or_create_list(
        space["id"], SUPPORT_LIST, "Questions the AI mentor escalated, each with a draft answer."
    )
    lists["support"] = support["id"]

    await get_mongo()[INTEGRATIONS].update_one(
        {"_id": "clickup"},
        {"$set": {"team_id": team["id"], "space_id": space["id"], "lists": lists, "timezone": tz}},
        upsert=True,
    )
    print(f"Saved list ids: {lists}")


if __name__ == "__main__":
    asyncio.run(main())
