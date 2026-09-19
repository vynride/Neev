"""Client meetings: live transcript ingestion and the in-meeting follow-up helper.

Whatever captures the call (a Meet caption extension, a bot, a replay script) posts speaker
turns to /segments. The student never pastes a transcript; the helper reads it from here.
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_user, require_role
from app.config import get_settings
from app.db.mongo import MEETINGS, PROJECT_MEMORY, get_mongo
from app.db.postgres import get_db
from app.ingest.docs import ingest_project_text
from app.llm.client import get_llm
from app.models import User
from app.routers.projects import get_project_for

router = APIRouter(prefix="/api", tags=["meetings"])

RECENT_SEGMENTS = 30

FOLLOWUP_SYSTEM = """A junior freelance developer is in a live call with her client right now.
She has told you privately what she is unsure about. Using the live transcript and the project
card, give her questions she can ask the client in the next minute.

Rules:
- 2 to 4 questions, each one sentence, polite, in plain English a non-technical client can answer.
- Prefer questions that offer concrete options ("Would you like A or B?") over open ones.
- Base them on what the client actually said in this call; quote the client's words in `based_on`.
- If the project card or an earlier decision already answers her doubt, say so in
  `already_known` instead of asking the client again.
- If the client is asking for something outside the agreed scope, set `scope_flag` to a one-line
  note she can use to raise it politely. Otherwise null.
- No technical jargon in the questions themselves."""

FOLLOWUP_SCHEMA = {
    "name": "followups",
    "schema": {
        "type": "object",
        "properties": {
            "understanding": {"type": "string"},
            "already_known": {"type": ["string", "null"]},
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "why": {"type": "string"},
                        "based_on": {"type": "string"},
                    },
                    "required": ["question", "why", "based_on"],
                    "additionalProperties": False,
                },
            },
            "scope_flag": {"type": ["string", "null"]},
        },
        "required": ["understanding", "already_known", "questions", "scope_flag"],
        "additionalProperties": False,
    },
}

SUMMARY_SYSTEM = """Summarise this client call for the project record in 3-5 sentences.
State the decisions made, the dates agreed, and the questions left open. Facts only."""


class MeetingIn(BaseModel):
    id: str
    project_id: str
    title: str


class Segment(BaseModel):
    t: str = Field(description="Timestamp within the call, HH:MM:SS")
    speaker: str
    text: str


class SegmentsIn(BaseModel):
    segments: list[Segment] = Field(min_length=1, max_length=200)


class FollowupIn(BaseModel):
    concern: str = Field(min_length=1, max_length=2000)


async def _meeting_for(meeting_id: str, user: User, db: AsyncSession) -> dict:
    meeting = await get_mongo()[MEETINGS].find_one({"_id": meeting_id})
    if meeting is None:
        raise HTTPException(404, "Unknown meeting")
    await get_project_for(user, meeting["project_id"], db)
    return meeting


def _transcript(segments: list[dict]) -> str:
    return "\n".join(f"[{s['t']}] {s['speaker']}: {s['text']}" for s in segments)


@router.post("/meetings")
async def start_meeting(
    body: MeetingIn, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    await get_project_for(user, body.project_id, db)
    doc = {
        "_id": body.id,
        "project_id": body.project_id,
        "title": body.title,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "status": "live",
        "summary": "",
        "segments": [],
    }
    await get_mongo()[MEETINGS].replace_one({"_id": body.id}, doc, upsert=True)
    return {"id": body.id, "status": "live"}


@router.get("/meetings/{meeting_id}")
async def get_meeting(
    meeting_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    m = await _meeting_for(meeting_id, user, db)
    return {"id": m.pop("_id"), **m}


@router.post("/meetings/{meeting_id}/segments")
async def add_segments(
    meeting_id: str,
    body: SegmentsIn,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    meeting = await _meeting_for(meeting_id, user, db)
    if meeting["status"] != "live":
        raise HTTPException(409, "Meeting has ended")
    await get_mongo()[MEETINGS].update_one(
        {"_id": meeting_id},
        {"$push": {"segments": {"$each": [s.model_dump() for s in body.segments]}}},
    )
    return {"id": meeting_id, "segments": len(meeting["segments"]) + len(body.segments)}


@router.post("/meetings/{meeting_id}/followups")
async def followups(
    meeting_id: str,
    body: FollowupIn,
    user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """One fast LLM call, no tool loop: she needs the answer while the client is still talking."""
    meeting = await _meeting_for(meeting_id, user, db)
    memory = await get_mongo()[PROJECT_MEMORY].find_one({"_id": meeting["project_id"]}) or {}
    recent = meeting["segments"][-RECENT_SEGMENTS:]
    if not recent:
        raise HTTPException(409, "No transcript yet for this meeting")

    prompt = (
        f"# Project card\n{memory.get('card') or 'Not available.'}\n\n"
        f"# Live transcript (most recent last)\n{_transcript(recent)}\n\n"
        f"# What she is unsure about\n{body.concern}"
    )
    result = await get_llm().complete(
        model=get_settings().model_strong,
        system=FOLLOWUP_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
        json_schema=FOLLOWUP_SCHEMA,
        effort="low",
        max_output_tokens=1500,
    )
    try:
        data = json.loads(result.text)
    except json.JSONDecodeError:
        raise HTTPException(502, "The model returned an unreadable reply") from None
    return {
        "meeting_id": meeting_id,
        "as_of": recent[-1]["t"],
        **data,
    }


@router.post("/meetings/{meeting_id}/end")
async def end_meeting(
    meeting_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    """Close the call: write its summary and make the transcript searchable by the mentor agent."""
    meeting = await _meeting_for(meeting_id, user, db)
    summary = meeting.get("summary", "")
    if meeting["segments"]:
        result = await get_llm().complete(
            model=get_settings().model_fast,
            system=SUMMARY_SYSTEM,
            messages=[{"role": "user", "content": _transcript(meeting["segments"])}],
            effort="low",
            max_output_tokens=600,
        )
        summary = result.text.strip()
    await get_mongo()[MEETINGS].update_one(
        {"_id": meeting_id}, {"$set": {"status": "ended", "summary": summary}}
    )
    chunks = await ingest_project_text(db, meeting["project_id"])
    return {"id": meeting_id, "status": "ended", "summary": summary, "chunks": chunks}
