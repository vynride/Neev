"""Shared answers: a general question is answered by the model once, then reused.

"What is an API?" reads the same for every student on every project, so its answer is stored
with the question's embedding. When anyone later asks the same thing, the stored answer is
served and the mentor agent (several calls to the strong model) never runs.

Whether two questions are the same is decided in two bands of cosine similarity:
- DIRECT and above: the same question. Served with no model call at all.
- JUDGE to DIRECT: could be a rewording ("hey, can you explain what an API means") or a
  different question ("What is an API key?"); embeddings alone cannot tell these apart. The
  fast model gives a yes/no. On yes, the new wording is stored as an alias, so the next person
  who words it that way is a direct hit.
"""

import json
import logging
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.mentor import MentorReply
from app.agent.search import embed_or_none
from app.config import get_settings
from app.llm.client import get_llm
from app.models import Project, SharedAnswer, User

log = logging.getLogger(__name__)

DIRECT_THRESHOLD = 0.86
JUDGE_THRESHOLD = 0.72
MAX_QUESTION_CHARS = 300  # longer questions carry code or specifics and are never general
MIN_ANSWER_CHARS = 200
PROJECT_MARKERS = re.compile(
    r"\[kb\w*\]|\.md[#\]]|project note|your (project|client|repo|codebase|mentor|task)|in your code"
)

JUDGE_SYSTEM = """Two students asked a mentor a question each. Decide whether one good answer
would fully serve both: the same topic, and the same thing being asked about it.
"What is an API?" and "can you explain what an API means" are the same.
"What is an API?" and "What is an API key?" are different. "How does a database work?" and
"How does indexing work?" are different. A question about the student's own project, code,
client or tasks is never the same as a general one. When unsure, answer false."""
JUDGE_SCHEMA = {
    "name": "same_question",
    "schema": {
        "type": "object",
        "properties": {"same": {"type": "boolean"}},
        "required": ["same"],
        "additionalProperties": False,
    },
}


@dataclass
class Hit:
    entry: SharedAnswer
    similarity: float
    judged: bool  # True when the fast model confirmed the match


def _lookup_worthy(question: str) -> bool:
    return 0 < len(question) <= MAX_QUESTION_CHARS and "```" not in question


async def _same_question(a: str, b: str) -> bool:
    try:
        result = await get_llm().complete(
            model=get_settings().model_fast,
            system=JUDGE_SYSTEM,
            messages=[{"role": "user", "content": f"Question 1: {a}\nQuestion 2: {b}"}],
            json_schema=JUDGE_SCHEMA,
            effort="none",
            max_output_tokens=200,
        )
        return bool(json.loads(result.text).get("same"))
    except Exception:  # noqa: BLE001  when the judge fails, answer fresh rather than risk a wrong reuse
        log.warning("Could not judge question similarity", exc_info=True)
        return False


async def find(db: AsyncSession, question: str) -> Hit | None:
    """The stored answer to this question, if someone has asked the same thing before."""
    if not _lookup_worthy(question):
        return None
    vec = await embed_or_none(question)
    if vec is None:
        return None
    distance = SharedAnswer.embedding.cosine_distance(vec)
    row = (
        await db.execute(
            select(SharedAnswer, distance)
            .where(SharedAnswer.embedding.is_not(None))
            .order_by(distance)
            .limit(1)
        )
    ).first()
    if row is None:
        return None
    nearest, similarity = row[0], 1 - float(row[1])
    if similarity < JUDGE_THRESHOLD:
        return None
    entry = await db.get(SharedAnswer, nearest.alias_of) if nearest.alias_of else nearest
    # An answer that students keep rejecting stops being offered
    if entry is None or entry.rejected >= 2 and entry.rejected > entry.helped:
        return None

    judged = similarity < DIRECT_THRESHOLD
    if judged:
        if not await _same_question(nearest.question, question):
            return None
        db.add(
            SharedAnswer(
                id=f"sa_{uuid.uuid4().hex[:10]}",
                category=entry.category,
                question=question,
                alias_of=entry.id,
                embedding=vec,
            )
        )
    entry.hits += 1
    entry.last_used_at = datetime.now(timezone.utc)
    await db.commit()
    return Hit(entry=entry, similarity=similarity, judged=judged)


def as_reply(hit: Hit) -> MentorReply:
    return MentorReply(
        category=hit.entry.category,
        scope="generic",
        next_action="answered",
        message=hit.entry.answer,
        resources=hit.entry.resources or [],
        tool_calls=[
            {
                "name": "shared_answer",
                "arguments": {"id": hit.entry.id, "asked_before_as": hit.entry.question},
                "output": f"Reused, similarity {hit.similarity:.2f}"
                + (", confirmed by the fast model" if hit.judged else ", no model call"),
            }
        ],
    )


def _reusable(reply: MentorReply, project: Project, student: User) -> bool:
    """Only an answer that would read the same to any student on any project."""
    if not reply.shareable or reply.next_action != "answered":
        return False
    if reply.sensitive or reply.wants_human or reply.draft_client_message:
        return False
    if len(reply.shareable) < MIN_ANSWER_CHARS:
        return False
    text = reply.shareable.lower()
    # The model sometimes leaves project detail in the general part. Such an answer is not shared.
    if PROJECT_MARKERS.search(text) or any(c["ref"].lower() in text for c in reply.citations):
        return False
    personal = [project.name, project.client_name, student.name.split()[0]]
    return not any(word and word.lower() in text for word in personal)


async def store(
    db: AsyncSession, question: str, reply: MentorReply, *, project: Project, student: User
) -> None:
    if not _lookup_worthy(question) or not _reusable(reply, project, student):
        return
    vec = await embed_or_none(question)
    if vec is None:
        return
    db.add(
        SharedAnswer(
            id=f"sa_{uuid.uuid4().hex[:10]}",
            category=reply.category,
            question=question,
            answer=reply.shareable,
            resources=reply.resources,
            embedding=vec,
        )
    )
    await db.commit()


async def feedback(db: AsyncSession, entry_id: str, resolved: bool) -> None:
    entry = await db.get(SharedAnswer, entry_id)
    if entry is None:
        return
    if resolved:
        entry.helped += 1
    else:
        entry.rejected += 1
    await db.commit()
