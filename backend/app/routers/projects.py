from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_user
from app.db.mongo import MEETINGS, PROJECT_MEMORY, get_mongo
from app.db.postgres import get_db
from app.models import Assignment, Project, Task, User

router = APIRouter(prefix="/api/projects", tags=["projects"])


async def get_project_for(user: User, project_id: str, db: AsyncSession) -> Project:
    """Load a project, checking the user is assigned to it (admins see everything)."""
    project = await db.get(Project, project_id)
    if project is None:
        raise HTTPException(404, "Unknown project")
    if user.role != "admin":
        rows = (
            (await db.execute(select(Assignment).where(Assignment.project_id == project_id)))
            .scalars()
            .all()
        )
        if not any(user.id in (a.student_id, a.mentor_id) for a in rows):
            raise HTTPException(403, "Not assigned to this project")
    return project


def task_out(t: Task) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "status": t.status,
        "assignee_id": t.assignee_id,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "priority": t.priority,
    }


@router.get("/{project_id}")
async def get_project(
    project_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    p = await get_project_for(user, project_id, db)
    tasks = (
        (
            await db.execute(
                select(Task).where(Task.project_id == project_id).order_by(Task.due_date)
            )
        )
        .scalars()
        .all()
    )

    mongo = get_mongo()
    memory = await mongo[PROJECT_MEMORY].find_one({"_id": project_id}) or {}
    meetings = (
        await mongo[MEETINGS]
        .find({"project_id": project_id}, {"segments": 0})
        .sort("started_at", 1)
        .to_list(50)
    )

    return {
        "id": p.id,
        "name": p.name,
        "client_name": p.client_name,
        "client_contact": p.client_contact,
        "repo_url": p.repo_url,
        "repo_synced_at": p.repo_synced_at.isoformat() if p.repo_synced_at else None,
        "stage": p.stage,
        "start_date": p.start_date.isoformat() if p.start_date else None,
        "deadline": p.deadline.isoformat() if p.deadline else None,
        "card": memory.get("card", ""),
        "tasks": [task_out(t) for t in tasks],
        "meetings": [
            {
                "id": m["_id"],
                "title": m["title"],
                "started_at": m["started_at"],
                "status": m["status"],
                "summary": m.get("summary", ""),
            }
            for m in meetings
        ],
    }
