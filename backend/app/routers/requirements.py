"""Mentor-only requirement editing and publication."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.db.postgres import get_db
from app.models import Requirement, RequirementVersion, User
from app.routers.projects import get_project_for
from app.services import audit, requirements

router = APIRouter(prefix="/api/mentor/projects/{project_id}/requirements", tags=["requirements"])


class RequirementIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=10000)
    effective_date: date | None = None
    expected_revision: int | None = None

    @field_validator("title", "body")
    @classmethod
    def meaningful_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Cannot be blank")
        return value.strip()


class PublishIn(BaseModel):
    expected_revision: int


def _out(req: Requirement) -> dict:
    return {
        "id": req.id,
        "project_id": req.project_id,
        "status": req.status,
        "version": req.version,
        "title": req.title,
        "body": req.body,
        "effective_date": req.effective_date,
        "draft_title": req.draft_title,
        "draft_body": req.draft_body,
        "draft_effective_date": req.draft_effective_date,
        "draft_revision": req.draft_revision,
        "edited_by": req.edited_by,
        "published_by": req.published_by,
        "published_at": req.published_at,
    }


async def _checked_project(project_id: str, user: User, db: AsyncSession) -> None:
    await get_project_for(user, project_id, db)


async def _checked_requirement(
    db: AsyncSession,
    project_id: str,
    requirement_id: str,
) -> Requirement:
    req = await db.get(Requirement, requirement_id, with_for_update=True)
    if req is None or req.project_id != project_id:
        raise HTTPException(404, "Unknown requirement")
    return req


@router.get("")
async def list_requirements(
    project_id: str,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    await _checked_project(project_id, user, db)
    rows = (
        (
            await db.execute(
                select(Requirement)
                .where(Requirement.project_id == project_id)
                .order_by(Requirement.updated_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [_out(row) for row in rows]


@router.post("", status_code=201)
async def create_requirement(
    project_id: str,
    body: RequirementIn,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _checked_project(project_id, user, db)
    req = await requirements.create_draft(
        db,
        project_id=project_id,
        mentor_id=user.id,
        title=body.title.strip(),
        body=body.body.strip(),
        effective_date=body.effective_date,
    )
    await audit.record(
        project_id=project_id,
        actor_id=user.id,
        action="requirement.created",
        target_id=req.id,
        after=_out(req),
    )
    return _out(req)


@router.get("/{requirement_id}")
async def get_requirement(
    project_id: str,
    requirement_id: str,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _checked_project(project_id, user, db)
    req = await db.get(Requirement, requirement_id)
    if req is None or req.project_id != project_id:
        raise HTTPException(404, "Unknown requirement")
    versions = (
        (
            await db.execute(
                select(RequirementVersion)
                .where(RequirementVersion.requirement_id == requirement_id)
                .order_by(RequirementVersion.version.desc())
            )
        )
        .scalars()
        .all()
    )
    return {
        **_out(req),
        "history": [
            {
                "version": v.version,
                "title": v.title,
                "body": v.body,
                "effective_date": v.effective_date,
                "published_by": v.published_by,
                "published_at": v.published_at,
            }
            for v in versions
        ],
    }


@router.put("/{requirement_id}")
async def edit_requirement(
    project_id: str,
    requirement_id: str,
    body: RequirementIn,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _checked_project(project_id, user, db)
    req = await _checked_requirement(db, project_id, requirement_id)
    before = _out(req)
    if body.expected_revision is None:
        raise HTTPException(400, "expected_revision is required")
    try:
        await requirements.save_draft(
            db,
            req,
            mentor_id=user.id,
            title=body.title.strip(),
            body=body.body.strip(),
            effective_date=body.effective_date,
            expected_revision=body.expected_revision,
        )
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    await audit.record(
        project_id=project_id,
        actor_id=user.id,
        action="requirement.draft_saved",
        target_id=req.id,
        before=before,
        after=_out(req),
    )
    return _out(req)


@router.post("/{requirement_id}/publish")
async def publish_requirement(
    project_id: str,
    requirement_id: str,
    body: PublishIn,
    user: User = Depends(require_role("mentor", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _checked_project(project_id, user, db)
    req = await _checked_requirement(db, project_id, requirement_id)
    before = _out(req)
    try:
        await requirements.publish(db, req, user.id, body.expected_revision)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    await audit.record(
        project_id=project_id,
        actor_id=user.id,
        action="requirement.published",
        target_id=req.id,
        before=before,
        after=_out(req),
    )
    return _out(req)
