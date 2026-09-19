from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_user, issue_token
from app.db.postgres import get_db
from app.models import Assignment, Project, User

router = APIRouter(prefix="/api", tags=["auth"])


class LoginIn(BaseModel):
    user_id: str


def user_out(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """Seeded users, so the demo login screen can offer a picker."""
    users = (await db.execute(select(User).order_by(User.role, User.id))).scalars().all()
    return [user_out(u) for u in users]


@router.post("/login")
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)) -> dict:
    user = await db.get(User, body.user_id)
    if user is None:
        raise HTTPException(404, "Unknown user")
    return {"token": issue_token(user), "user": user_out(user)}


@router.get("/me")
async def me(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)) -> dict:
    query = select(Project).distinct()
    if user.role != "admin":
        query = query.join(Assignment, Assignment.project_id == Project.id).where(
            or_(Assignment.student_id == user.id, Assignment.mentor_id == user.id)
        )
    projects = (await db.execute(query.order_by(Project.id))).scalars().all()
    return {
        **user_out(user),
        "projects": [{"id": p.id, "name": p.name, "stage": p.stage} for p in projects],
    }
