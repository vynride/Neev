"""Sarvam speech: transcribe what the student said, and speak the mentor's reply."""

import base64
import logging
import re

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

BASE_URL = "https://api.sarvam.ai"
STT_MODEL = "saaras:v3"
TTS_MODEL = "bulbul:v3"
TTS_SPEAKER = "priya"
TTS_MAX_CHARS = 2400  # bulbul:v3 accepts 2500

# Languages the voice can speak. Anything else is spoken as Indian English.
TTS_LANGUAGES = {
    "en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "od-IN", "pa-IN", "ta-IN",
    "te-IN",
}  # fmt: skip

LANGUAGE_NAMES = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "bn-IN": "Bengali",
    "gu-IN": "Gujarati",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "mr-IN": "Marathi",
    "od-IN": "Odia",
    "pa-IN": "Punjabi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
}


class SarvamError(Exception):
    pass


def enabled() -> bool:
    return bool(get_settings().sarvam_api_key)


def _headers() -> dict:
    if not enabled():
        raise SarvamError("Voice is not set up: SARVAM_API_KEY is missing")
    return {"api-subscription-key": get_settings().sarvam_api_key}


async def _post(path: str, **kwargs) -> dict:
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(f"{BASE_URL}{path}", headers=_headers(), **kwargs)
    except httpx.HTTPError as exc:
        raise SarvamError(f"Could not reach the voice service: {exc}") from exc
    if res.status_code >= 400:
        log.warning("Sarvam %s returned %s: %s", path, res.status_code, res.text[:300])
        raise SarvamError(f"The voice service returned an error ({res.status_code})")
    return res.json()


async def transcribe(audio: bytes, filename: str, content_type: str) -> tuple[str, str]:
    """Returns (transcript, language code). The language is detected from the audio."""
    data = await _post(
        "/speech-to-text",
        files={"file": (filename, audio, content_type)},
        data={"model": STT_MODEL, "language_code": "unknown"},
    )
    language = data.get("language_code") or "en-IN"
    return (data.get("transcript") or "").strip(), language


def speakable(text: str) -> str:
    """Strip what should not be read aloud: code, markdown marks, links."""
    text = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"[`*_#>|]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > TTS_MAX_CHARS:
        cut = text[:TTS_MAX_CHARS]
        text = cut[: cut.rfind(". ") + 1] or cut
    return text


async def speak(text: str, language: str) -> bytes:
    """Returns MP3 audio of the text."""
    data = await _post(
        "/text-to-speech",
        json={
            "text": speakable(text),
            "target_language_code": language if language in TTS_LANGUAGES else "en-IN",
            "model": TTS_MODEL,
            "speaker": TTS_SPEAKER,
            "output_audio_codec": "mp3",
        },
    )
    audios = data.get("audios") or []
    if not audios:
        raise SarvamError("The voice service returned no audio")
    return base64.b64decode(audios[0])
