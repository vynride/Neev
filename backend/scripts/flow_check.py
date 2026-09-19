"""Checks the escalation sequence with a scripted fake LLM. Needs the databases, not LLM keys.

    make seed && uv run python -m scripts.flow_check

Covers: grounded answer with citation filtering, retry, ticket creation, mentor resolve,
and the same question being answered from the knowledge base afterwards.
"""

import asyncio
import json
import random

import httpx

from app.agent import search
from app.db.postgres import SessionLocal
from app.ingest.docs import ingest_project_text
from app.llm import client as llm_client
from app.llm.client import LLMResult, ToolCall
from app.main import app
from app.routers import chat as chat_router
from app.services import escalation

QUESTION = "Customers pay but the order does not show up. What is wrong?"


class FakeLLM:
    """Classifies everything as project debugging, greps once, then answers with citations."""

    async def complete(self, *, system, messages, tools=None, json_schema=None, **_) -> LLMResult:
        if json_schema and json_schema["name"] == "route":
            wants_human = "talk to my mentor" in messages[-1]["content"]
            return LLMResult(
                text=json.dumps(
                    {
                        "category": "development_debugging",
                        "scope": "project_specific",
                        "wants_human": wants_human,
                    }
                )
            )
        if tools and not any(m["role"] == "tool" for m in messages):
            return LLMResult(
                tool_calls=[ToolCall("c1", "search_docs", {"query": "payment order missing"})]
            )
        seen = next((m["content"] for m in messages if m["role"] == "tool"), "")
        real_ref = seen.split("[ref: ")[1].split("]")[0] if "[ref: " in seen else "none"
        return LLMResult(
            text=json.dumps(
                {
                    "next_action": "answered",
                    "message": "Retry answer." if "This is a retry" in system else "First answer.",
                    "citations": [
                        {"type": "meeting", "ref": real_ref, "snippet": "seen"},
                        {"type": "code", "ref": "made/up.js:1", "snippet": "never read"},
                    ],
                    "resources": [{"title": "x", "url": "https://invented.example", "why": "y"}],
                    "draft_client_message": None,
                    "sensitive": False,
                    "sensitive_reason": None,
                    "struggle_topic": "Stripe webhooks",
                }
            )
        )

    async def embed(self, texts):
        # Seeded by the first line, so a question matches the KB entry made from it and
        # unrelated texts land near zero similarity
        out = []
        for t in texts:
            rng = random.Random(t.split("\n")[0])
            out.append([rng.gauss(0, 1) for _ in range(1536)])
        return out


def check(label: str, ok: bool) -> None:
    print(("PASS " if ok else "FAIL ") + label)
    if not ok:
        raise SystemExit(1)


async def main() -> None:
    llm_client._llm = FakeLLM()

    async def fake_embed_query(query):
        return (await FakeLLM().embed([query]))[0]

    search.embed_or_none = fake_embed_query
    escalation.embed_or_none = fake_embed_query

    async def no_repo_refresh(project_id):
        return None

    chat_router._refresh_repo = no_repo_refresh

    async with SessionLocal() as db:
        await ingest_project_text(db, "p1", embed=False)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api") as c:

        async def login(user_id):
            token = (await c.post("/login", json={"user_id": user_id})).json()["token"]
            return {"authorization": f"Bearer {token}"}

        student, mentor = await login("s1"), await login("m1")

        r = await c.post("/chat", headers=student, json={"project_id": "p1", "message": QUESTION})
        first = r.json()
        check("first answer returned", r.status_code == 200 and first["message"] == "First answer.")
        check("category shown", first["category"] == "development_debugging")
        check(
            "unseen citation and invented link dropped",
            len(first["citations"]) == 1 and first["resources"] == [] and first["grounded"],
        )

        r = await c.post(
            f"/chat/{first['message_id']}/feedback", headers=student, json={"resolved": False}
        )
        retry = r.json()
        check(
            "not resolved -> one retry",
            retry["attempt"] == 2 and retry["message"] == "Retry answer.",
        )

        r = await c.post(
            f"/chat/{retry['message_id']}/feedback", headers=student, json={"resolved": False}
        )
        esc = r.json()
        check(
            "retry failed -> escalated with ticket",
            esc["next_action"] == "escalated" and esc["ticket_id"],
        )

        detail = (await c.get(f"/mentor/tickets/{esc['ticket_id']}", headers=mentor)).json()
        check(
            "ticket has draft, tried, chat and project card keys",
            detail["draft_answer"] == "Retry answer."
            and "First attempt" in detail["tried"]
            and len(detail["chat"]) >= 3
            and "card" in detail["project"],
        )

        r = await c.post(
            f"/mentor/tickets/{esc['ticket_id']}/resolve",
            headers=mentor,
            json={"answer": "Add a Stripe webhook for checkout.session.completed."},
        )
        check("mentor resolves -> KB entry", r.status_code == 200 and r.json()["kb_entry_id"])

        log = (await c.get(f"/sessions/{first['session_id']}", headers=student)).json()
        check("mentor answer delivered into the chat", log["turns"][-1]["role"] == "mentor")
        check("student does not see tool trace", "tool_calls" not in log["turns"][1])

        # A second student asks the same thing and exhausts the retry: KB answers, no new ticket
        other = await login("s2")
        a = (
            await c.post("/chat", headers=other, json={"project_id": "p1", "message": QUESTION})
        ).json()
        b = (
            await c.post(
                f"/chat/{a['message_id']}/feedback", headers=other, json={"resolved": False}
            )
        ).json()
        k = (
            await c.post(
                f"/chat/{b['message_id']}/feedback", headers=other, json={"resolved": False}
            )
        ).json()
        check(
            "repeat question answered from KB, not escalated",
            k["next_action"] == "answered"
            and k["citations"][0]["type"] == "kb"
            and k["ticket_id"] is None,
        )

        h = (
            await c.post(
                "/chat",
                headers=student,
                json={"project_id": "p1", "message": "I want to talk to my mentor about pricing"},
            )
        ).json()
        check("asking for a human escalates directly", h["next_action"] == "escalated")

        m = (await c.get("/mentor/metrics", headers=mentor)).json()
        check(f"metrics computed (deflection {m['deflection_rate']})", m["questions"] >= 3)

        r = await c.post("/chat", headers=mentor, json={"project_id": "p1", "message": "hi"})
        check("mentors cannot use the student chat", r.status_code == 403)


if __name__ == "__main__":
    asyncio.run(main())
