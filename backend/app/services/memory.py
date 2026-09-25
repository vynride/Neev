"""The memory hierarchy above the raw session log.

    session log  ->  session summary  ->  student memory (markdown, mentor-editable)
                                      ->  project memory (project card + decisions)

Student memory is loaded into every prompt, so it stays short and human-readable.
"""

import logging
import re
from datetime import datetime, timezone

from openai import OpenAIError

from app.config import get_settings
from app.db.mongo import SESSION_SUMMARIES, SESSIONS, STUDENT_MEMORY, get_mongo
from app.llm.client import get_llm
from app.services.run_traces import RunTrace, persist, record_event, use_run

log = logging.getLogger(__name__)

STRUGGLES_HEADING = "## Recurring struggles"
MAX_STRUGGLES_SHOWN = 6

SUMMARY_SYSTEM = """Summarise this mentoring session in 3-4 sentences for the mentor's records:
what the student asked, what resolved it (or did not), and anything left open. Facts only."""

MEMORY_SYSTEM = f"""You maintain a short memory file about a student for her AI mentor.
Update the file using the new session summary. Rules:
- Keep the same markdown headings, in the same order.
- Do not change the "{STRUGGLES_HEADING}" section at all; it is maintained separately.
- Under "## What works for this student", record explanation styles that helped or did not
  (for example "step-by-step with a diagram worked for webhooks"). Only what the summary supports.
- Keep scores and facts that are already there. Never invent scores.
- Whole file under 250 words. Return only the markdown."""


def _render_struggles(struggles: dict) -> str:
    if not struggles:
        return "None recorded yet."
    top = sorted(struggles.items(), key=lambda kv: (-kv[1]["count"], kv[0]))[:MAX_STRUGGLES_SHOWN]
    return "\n".join(
        f"- {topic} ({v['category'].replace('_', ' ')}): asked {v['count']}x, last {v['last']}"
        for topic, v in top
    )


def _replace_section(markdown: str, heading: str, body: str) -> str:
    pattern = re.compile(rf"({re.escape(heading)}\n)(.*?)(?=\n## |\Z)", re.DOTALL)
    if pattern.search(markdown):
        return pattern.sub(lambda m: m.group(1) + body + "\n", markdown, count=1)
    return markdown.rstrip() + f"\n\n{heading}\n{body}\n"


async def note_struggle(student_id: str, category: str, topic: str) -> None:
    """Count a skill gap the agent spotted and refresh that section of the memory file."""
    coll = get_mongo()[STUDENT_MEMORY]
    doc: dict = await coll.find_one({"_id": student_id}) or {}
    struggles: dict = doc.get("struggles", {})
    key = topic.strip().lower()[:60]
    entry = struggles.get(key, {"count": 0, "category": category})
    entry.update(
        count=entry["count"] + 1, category=category, last=datetime.now().date().isoformat()
    )
    struggles[key] = entry
    markdown = _replace_section(
        doc.get("markdown", ""), STRUGGLES_HEADING, _render_struggles(struggles)
    )
    await coll.update_one(
        {"_id": student_id}, {"$set": {"struggles": struggles, "markdown": markdown}}, upsert=True
    )
    record_event(
        "student_memory.struggle_updated",
        output={
            "student_id": student_id,
            "category": category,
            "topic": topic,
            "markdown": markdown,
        },
    )


async def set_student_memory(student_id: str, markdown: str, editor: str) -> None:
    await get_mongo()[STUDENT_MEMORY].update_one(
        {"_id": student_id},
        {
            "$set": {
                "markdown": markdown,
                "edited_by": editor,
                "edited_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )


async def summarise_pending(student_id: str, project_id: str, current_session_id: str) -> int:
    """Summarise the student's finished sessions and fold them into her memory file.

    A session counts as finished once she has started a newer one.
    """
    mongo = get_mongo()
    llm = get_llm()
    fast = get_settings().model_fast
    done = 0
    cursor = mongo[SESSIONS].find(
        {
            "student_id": student_id,
            "project_id": project_id,
            "summarised": False,
            "_id": {"$ne": current_session_id},
        }
    )
    async for session in cursor:
        turns = [t for t in session["turns"] if t["role"] in ("student", "assistant", "mentor")]
        if len(turns) < 2:
            continue
        transcript = "\n".join(f"{t['role']}: {t['content'][:1500]}" for t in turns)
        trace = RunTrace(
            project_id=project_id,
            actor_id=student_id,
            question=f"Summarise session {session['_id']}",
        )
        trace.session_id = session["_id"]
        with use_run(trace):
            record_event("agent.memory.input", input={"transcript": transcript})
            try:
                summary = (
                    await llm.complete(
                        model=fast,
                        system=SUMMARY_SYSTEM,
                        messages=[{"role": "user", "content": transcript}],
                        effort="low",
                        max_output_tokens=500,
                    )
                ).text.strip()
                doc = await mongo[STUDENT_MEMORY].find_one({"_id": student_id}) or {}
                updated = (
                    await llm.complete(
                        model=fast,
                        system=MEMORY_SYSTEM,
                        messages=[
                            {
                                "role": "user",
                                "content": f"# Current file\n{doc.get('markdown', '')}\n\n"
                                f"# New session summary\n{summary}",
                            }
                        ],
                        effort="low",
                        max_output_tokens=900,
                    )
                ).text.strip()
                await mongo[SESSION_SUMMARIES].update_one(
                    {"_id": session["_id"]},
                    {
                        "$set": {
                            "student_id": student_id,
                            "project_id": project_id,
                            "summary": summary,
                            "created_at": session["updated_at"],
                        }
                    },
                    upsert=True,
                )
                if updated:
                    struggles = _render_struggles(doc.get("struggles", {}))
                    markdown = _replace_section(updated, STRUGGLES_HEADING, struggles)
                    await mongo[STUDENT_MEMORY].update_one(
                        {"_id": student_id}, {"$set": {"markdown": markdown}}, upsert=True
                    )
                await mongo[SESSIONS].update_one(
                    {"_id": session["_id"]}, {"$set": {"summarised": True}}
                )
                trace.outcome = "summarised"
                record_event("agent.memory.updated", output={"summary": summary, "memory": updated})
                done += 1
            except OpenAIError as exc:
                trace.outcome, trace.error = "error", repr(exc)
                log.warning("Could not summarise session %s", session["_id"], exc_info=True)
            finally:
                await persist(trace)
    return done
