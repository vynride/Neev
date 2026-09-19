import base64
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_user, require_role
from app.db.postgres import get_db
from app.integrations import sarvam
from app.models import User
from app.routers.chat import _refresh_repo
from app.routers.projects import get_project_for
from app.services import chat, memory

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/voice", tags=["voice"])

MAX_AUDIO_BYTES = 10 * 1024 * 1024


class SpeakIn(BaseModel):
    text: str = Field(min_length=1, max_length=6000)
    language: str = "en-IN"


async def _audio_for(text: str, language: str) -> str | None:
    """Base64 MP3 of the text, or None when speech fails: the written reply still stands."""
    try:
        return base64.b64encode(await sarvam.speak(text, language)).decode()
    except sarvam.SarvamError:
        log.warning("Could not speak the reply", exc_info=True)
        return None


@router.get("/status")
async def voice_status(user: User = Depends(current_user)) -> dict:
    return {"enabled": sarvam.enabled()}


@router.post("/ask")
async def post_voice(
    background: BackgroundTasks,
    audio: UploadFile = File(...),
    project_id: str = Form(...),
    session_id: str | None = Form(None),
    user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """A spoken question: transcribe it, answer it as a chat turn, and speak the answer."""
    project = await get_project_for(user, project_id, db)
    if not sarvam.enabled():
        raise HTTPException(503, "Voice is not set up on this server")
    recording = await audio.read()
    if not recording:
        raise HTTPException(400, "The recording is empty")
    if len(recording) > MAX_AUDIO_BYTES:
        raise HTTPException(413, "The recording is too long. Keep it under a minute or two.")

    # Browsers send "audio/webm;codecs=opus"; Sarvam only accepts the bare type
    content_type = (audio.content_type or "audio/webm").split(";")[0].strip()
    try:
        transcript, language = await sarvam.transcribe(
            recording, audio.filename or "question.webm", content_type
        )
    except sarvam.SarvamError as exc:
        raise HTTPException(502, str(exc)) from exc
    if not transcript:
        raise HTTPException(422, "I could not hear anything. Try again, closer to the mic.")

    language_name = sarvam.LANGUAGE_NAMES.get(language, "English")
    reply = await chat.ask(
        db,
        student=user,
        project=project,
        session_id=session_id or None,
        message=transcript[:6000],
        voice=True,
        extra_context=f"She spoke in {language_name}. Reply in {language_name}.",
    )
    if not session_id:
        background.add_task(_refresh_repo, project.id)
        background.add_task(memory.summarise_pending, user.id, project.id, reply["session_id"])

    spoken = reply.get("message") or ""
    return {
        **reply,
        "transcript": transcript,
        "language": language,
        "audio": await _audio_for(spoken, language) if spoken else None,
        "audio_mime": "audio/mpeg",
    }


@router.post("/speak")
async def post_speak(body: SpeakIn, user: User = Depends(current_user)) -> dict:
    """Read any message aloud, for the listen button in the chat."""
    if not sarvam.enabled():
        raise HTTPException(503, "Voice is not set up on this server")
    try:
        mp3 = await sarvam.speak(body.text, body.language)
    except sarvam.SarvamError as exc:
        raise HTTPException(502, str(exc)) from exc
    return {"audio": base64.b64encode(mp3).decode(), "audio_mime": "audio/mpeg"}
