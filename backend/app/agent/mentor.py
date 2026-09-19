"""The mentor agent: classify the question, run the tool loop, validate what comes back."""

import json
import logging
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.prompts import ANSWER_SCHEMA, CLASSIFY_SCHEMA, CLASSIFY_SYSTEM, build_system
from app.agent.tools import ToolContext, run_tool, tools_for
from app.config import get_settings
from app.db.mongo import PROJECT_MEMORY, STUDENT_MEMORY, get_mongo
from app.llm.client import get_llm
from app.models import Project

log = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 8
HISTORY_TURNS = 10


@dataclass
class Route:
    category: str = "development_debugging"
    scope: str = "project_specific"
    wants_human: bool = False


@dataclass
class MentorReply:
    category: str
    scope: str
    next_action: str
    message: str
    citations: list[dict] = field(default_factory=list)
    resources: list[dict] = field(default_factory=list)
    draft_client_message: str | None = None
    sensitive: bool = False
    sensitive_reason: str | None = None
    struggle_topic: str | None = None
    wants_human: bool = False
    excerpts: list[dict] = field(default_factory=list)
    tool_calls: list[dict] = field(default_factory=list)

    @property
    def grounded(self) -> bool:
        return bool(self.citations)


async def classify(message: str, history: list[dict]) -> Route:
    recent = "\n".join(f"{m['role']}: {m['content'][:300]}" for m in history[-4:])
    prompt = f"Recent conversation:\n{recent}\n\nNew question:\n{message}" if recent else message
    try:
        result = await get_llm().complete(
            model=get_settings().model_fast,
            system=CLASSIFY_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            json_schema=CLASSIFY_SCHEMA,
            effort="low",
            max_output_tokens=500,
        )
        return Route(**json.loads(result.text))
    except (json.JSONDecodeError, TypeError):
        log.warning("Classifier returned unusable output; using defaults")
        return Route()


def _validate(reply: dict, ctx: ToolContext) -> tuple[list[dict], list[dict]]:
    """Keep only citations and links that a tool actually returned in this turn."""
    citations = []
    for c in reply.get("citations", []):
        ref = c.get("ref", "").strip()
        if c.get("type") == "code":
            path = ref.split(":")[0].lstrip("/")
            if path in ctx.seen_code_paths:
                citations.append(c)
        elif ref in ctx.seen_refs:
            citations.append(c)
    resources = [r for r in reply.get("resources", []) if r.get("url") in ctx.seen_urls]
    return citations, resources[:3]


async def answer(
    db: AsyncSession,
    *,
    project: Project,
    student_id: str,
    message: str,
    history: list[dict],
    previous_answer: str | None = None,
    voice: bool = False,
    extra_context: str | None = None,
) -> MentorReply:
    """One mentor turn. `history` is prior {"role", "content"} messages, oldest first."""
    llm = get_llm()
    settings = get_settings()
    mongo = get_mongo()

    route = await classify(message, history)
    student_doc = await mongo[STUDENT_MEMORY].find_one({"_id": student_id}) or {}
    project_doc = await mongo[PROJECT_MEMORY].find_one({"_id": project.id}) or {}

    system = build_system(
        category=route.category,
        student_memory=student_doc.get("markdown", ""),
        project_name=project.name,
        project_card=project_doc.get("card", ""),
        previous_answer=previous_answer,
        voice=voice,
    )
    if extra_context:
        system += "\n\n" + extra_context

    ctx = ToolContext(db=db, project_id=project.id, student_id=student_id)
    tools = tools_for(route.scope)
    messages: list[dict] = [*history[-HISTORY_TURNS:], {"role": "user", "content": message}]
    effort = "high" if previous_answer else "low"

    text = ""
    for round_no in range(MAX_TOOL_ROUNDS + 1):
        last_round = round_no == MAX_TOOL_ROUNDS
        result = await llm.complete(
            model=settings.model_strong,
            system=system,
            messages=messages,
            tools=None if last_round else tools,
            json_schema=ANSWER_SCHEMA,
            effort=effort,
            max_output_tokens=6000,
        )
        if not result.tool_calls:
            text = result.text
            break
        messages.append(result.as_message())
        for call in result.tool_calls:
            output = await run_tool(ctx, call.name, call.arguments)
            messages.append({"role": "tool", "tool_call_id": call.id, "content": output})

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = {"next_action": "answered", "message": text or "I could not produce an answer."}

    citations, resources = _validate(data, ctx)
    return MentorReply(
        category=route.category,
        scope=route.scope,
        next_action=data.get("next_action", "answered"),
        message=data.get("message", ""),
        citations=citations,
        resources=resources,
        draft_client_message=data.get("draft_client_message"),
        sensitive=bool(data.get("sensitive")),
        sensitive_reason=data.get("sensitive_reason"),
        struggle_topic=data.get("struggle_topic"),
        wants_human=route.wants_human,
        excerpts=ctx.excerpts[:8],
        tool_calls=ctx.calls,
    )
