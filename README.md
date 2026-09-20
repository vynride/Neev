# Team-21

AI mentor for Barabari Collective students working on freelance client projects. Code for Good 2026, Hyderabad.

## Docs

- [`docs/design.md`](docs/design.md): decisions, architecture, API contract, data shapes
- [`docs/scalability.md`](docs/scalability.md): shared answers for general questions, and how cost and mentor time stay flat as students grow
- [`docs/build-log.md`](docs/build-log.md): what was built step by step, what was tested, what was measured
- [`CONTEXT.md`](CONTEXT.md): glossary
- [`docs/project-scope/`](docs/project-scope/): challenge statement, Q&A transcript, sample questions
- [`deploy/`](deploy/): EC2 setup (Caddy with automatic HTTPS, systemd service)

## Setup

```sh
make hooks                              # install the pre-commit hook, once
cp backend/.env.example backend/.env    # then fill in the keys
make db                                 # optional: local Postgres + MongoDB in Docker
make seed                               # users, projects, briefs, transcripts, tasks
make ingest                             # needs LLM keys: chunks, project cards, repo maps
make dev                                # API on http://localhost:8000, docs at /docs
cd backend && uv run python -m scripts.clickup_setup   # optional: needs CLICKUP_TOKEN, creates the lists and tasks
```

## Checks

```sh
make check    # 15 checks of the escalation flow with a fake LLM; uses the local databases only (make db)
make smoke    # the demo path against a running server with real models
cd backend && uv run python -m scripts.check_llm        # which OpenAI API shape works with tools
```

Seeded logins (`POST /api/login` with `{"user_id": ...}`): students `s1`-`s5`, mentors `m1`-`m2`, admin `a1`.

## Layout

- `backend/`: FastAPI service
  - `app/agent/`: classifier, prompts, tools, hybrid search, the mentor loop
  - `app/ingest/`: repo clone, chunking, project card, repo map
  - `app/services/`: escalation sequence, tickets and knowledge base, sessions, memory
  - `app/routers/`: HTTP API
  - `seed_data/`: synthetic projects, students and mentor answers
- `frontend/`: React app, wired to the API. Students get `/student`, mentors and admins get `/mentor`.
- `scripts/`: git hooks

## Running the whole app

Two terminals:

```
make dev                                  # API on http://localhost:8000
cd frontend && npm install && npm run dev # app on http://localhost:3000
```

The frontend proxies `/api` to the backend, so there is nothing to configure. Log in by picking a
seeded account: a student (`s1`-`s5`) opens the student app, a mentor (`m1`, `m2`) opens the mentor
desk. To see an escalation end to end, keep a student and a mentor open in two browser profiles.

## Demo data

`make demo` loads a fortnight of realistic activity: 16 student chats across the three projects,
open tickets with AI drafts, resolved tickets with the mentor's answer (saved to the knowledge
base), one reused answer, one FYI, metrics and recurring struggles. It makes no model calls.
Everything it writes has an id starting with `demo_`; `make demo ARGS=--force` replaces only that.
After a `make seed`, run `make ingest` and then `make demo`.

## Voice

**Call.** The Call button in the chat opens a hands-free call with the AI mentor. She talks, a
pause ends her turn, the answer is spoken, and the call listens again until she hangs up. She can
mute, or interrupt an answer. Every turn is saved in the chat, and the usual rules apply: a
question the AI should not answer still becomes a mentor ticket.

**Voice message.** The mic records one question and the answer plays by itself. Every AI and
mentor message also has a Listen button.

Both use Sarvam: `POST /api/voice/ask` transcribes the audio (language detected from it), answers
it as a normal chat turn in a short spoken style and in the language she used, and returns the
answer with MP3 audio. `POST /api/voice/speak` reads any text aloud.

Set `SARVAM_API_KEY` in `backend/.env`. Without it the voice buttons are hidden and the chat works
as before. Microphone access needs `localhost` or HTTPS.
