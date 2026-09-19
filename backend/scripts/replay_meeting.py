"""Replay a seeded transcript into a live meeting, one speaker turn at a time.

Stands in for the Meet caption extension during a demo.

    uv run python -m scripts.replay_meeting                       # p1's live meeting, 3s per turn
    uv run python -m scripts.replay_meeting --delay 1 --api http://host/api
"""

import argparse
import json
import time
from pathlib import Path

import httpx

SEED = Path(__file__).resolve().parent.parent / "seed_data" / "projects"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default="p1")
    ap.add_argument("--api", default="http://localhost:8000/api")
    ap.add_argument("--user", default="s1", help="user id to post as")
    ap.add_argument("--delay", type=float, default=3.0, help="seconds between speaker turns")
    args = ap.parse_args()

    meeting = json.loads((SEED / args.project / "live_meeting.json").read_text())
    with httpx.Client(base_url=args.api, timeout=30) as c:
        token = c.post("/login", json={"user_id": args.user}).json()["token"]
        c.headers["authorization"] = f"Bearer {token}"
        c.post(
            "/meetings",
            json={"id": meeting["id"], "project_id": args.project, "title": meeting["title"]},
        ).raise_for_status()
        print(f"Meeting {meeting['id']} is live")
        for seg in meeting["segments"]:
            c.post(
                f"/meetings/{meeting['id']}/segments", json={"segments": [seg]}
            ).raise_for_status()
            print(f"[{seg['t']}] {seg['speaker']}: {seg['text'][:90]}")
            time.sleep(args.delay)
    print("Replay finished. POST /meetings/{id}/end to close the call.")


if __name__ == "__main__":
    main()
