"""The demo path against a running server with real models.

    make seed && uv run python -m app.ingest.pipeline      # once
    uv run python -m scripts.smoke [--api https://host/api]

Prints what came back at each step so a human can judge quality; exits non-zero only when
the mechanics break (wrong status, missing fields), not on wording.
"""

import argparse
import sys

import httpx

CODE_Q = "Where do we store the refresh token in this project, and is that a safe choice?"
AMBIGUOUS_Q = (
    "The client wants a modern dashboard with analytics. Which metrics should I build first?"
)
LEARN_Q = "I have no idea how Stripe webhooks work. How should I approach adding one here?"


def show(title: str, r: dict) -> None:
    print(f"\n=== {title}")
    print(
        f"category={r.get('category')} action={r.get('next_action')} grounded={r.get('grounded')}"
    )
    print((r.get("message") or "")[:700])
    for c in r.get("citations", [])[:4]:
        print(f"  cite [{c['type']}] {c['ref']}")
    for res in r.get("resources", []):
        print(f"  link {res['url']}")
    if r.get("draft_client_message"):
        print(f"  draft to client: {r['draft_client_message'][:300]}")


def need(ok: bool, what: str) -> None:
    if not ok:
        print(f"\nSMOKE FAILED: {what}")
        sys.exit(1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:8000/api")
    args = ap.parse_args()

    with httpx.Client(base_url=args.api, timeout=180) as c:

        def login(uid: str) -> dict:
            return {
                "authorization": f"Bearer {c.post('/login', json={'user_id': uid}).json()['token']}"
            }

        student, mentor = login("s1"), login("m1")

        def ask(message: str, session_id: str | None = None) -> dict:
            r = c.post(
                "/chat",
                headers=student,
                json={"project_id": "p1", "message": message, "session_id": session_id},
            )
            need(r.status_code == 200, f"/chat returned {r.status_code}: {r.text[:300]}")
            return r.json()

        code = ask(CODE_Q)
        show("Code question", code)
        need(any(x["type"] == "code" for x in code["citations"]), "no code citation")

        amb = ask(AMBIGUOUS_Q, code["session_id"])
        show("Ambiguous requirement", amb)
        need(amb["next_action"] == "ask_client" and amb["draft_client_message"], "no client draft")

        learn = ask(LEARN_Q, code["session_id"])
        show("Learning question", learn)
        need("```mermaid" in learn["message"] or learn["resources"], "no diagram or resources")

        retry = c.post(
            f"/chat/{learn['message_id']}/feedback", headers=student, json={"resolved": False}
        ).json()
        show("Retry", retry)
        esc = c.post(
            f"/chat/{retry['message_id']}/feedback", headers=student, json={"resolved": False}
        ).json()
        show("After second miss", esc)
        need(esc["next_action"] in ("escalated", "answered"), "no escalation outcome")

        if esc.get("ticket_id"):
            detail = c.get(f"/mentor/tickets/{esc['ticket_id']}", headers=mentor).json()
            print(f"\n=== Mentor sees a draft of {len(detail['draft_answer'])} chars")
            r = c.post(
                f"/mentor/tickets/{esc['ticket_id']}/resolve",
                headers=mentor,
                json={"answer": detail["draft_answer"]},
            )
            need(r.status_code == 200 and r.json()["kb_entry_id"], "resolve failed")
            print(f"Resolved. KB entry {r.json()['kb_entry_id']}")

        print("\n=== Metrics")
        print(c.get("/mentor/metrics", headers=mentor).json())
    print("\nSMOKE OK")


if __name__ == "__main__":
    main()
