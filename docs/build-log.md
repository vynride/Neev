# Build log

What was built, in order, with what each step was checked against and what it found.
Decisions and their reasons are in [`design.md`](design.md). Terms are in [`CONTEXT.md`](../CONTEXT.md).

## Status

| Area | State |
|---|---|
| Escalation logic | 15 of 15 checks pass (`make check`, fake model, local databases) |
| Real-model demo path | Passes (`make smoke`) against Azure OpenAI (luna + terra), Supabase Mumbai, Atlas and Exa |
| Answer latency | 12 to 18 s |
| Deployment to EC2 | Config written, not deployed |
| Pull requests | #1 to #13 merged into `main` |
| ClickUp | Working against a real workspace, both directions |

## Step 1: Guardrails before any code (PR #1)

- `docs/design.md`, `CONTEXT.md`, `.gitignore`, `backend/.env.example`.
- `scripts/pre-commit`, installed with `make hooks`. Blocks `.env` files, key files, archives, `ssh-creds/`, cloned repos, files over 1 MB, and content matching key or connection-string patterns.
- **Checked:** staged a file holding a fake database password; the hook rejected it.
- **Found later:** the hook also rejected a real commit, because the local dev default was `mentor:mentor@localhost`. The dev database now uses passwordless trust auth. The hook was left as strict as it was.

## Step 2: Skeleton (PR #2)

- FastAPI app, CORS, `/api/health`, async Postgres and MongoDB connections.
- `LLMClient` interface with two implementations: Responses API and Chat Completions. Neutral message format so the agent loop does not care which one runs. `temperature` is never sent.
- `docker-compose.dev.yml` for local databases.
- **Found:** Docker on this drive cannot change permissions on data volumes (the containers exited at start). Dev databases keep data in memory (tmpfs); run `make seed` after a restart.
- **Checked:** health endpoint returns ok against both databases.

## Step 3: Models, seed data, login (PR #3)

- Postgres tables: users, student scores, projects, assignments, tasks (ClickUp-shaped), tickets, knowledge base entries, chunks, metric events.
- Seed data in `backend/seed_data/`: 3 client projects mapped to real public MIT-licensed repos, each with a brief, a statement of work, 2 call transcripts and 8-10 tasks; 5 students with CodeGuru and Samvad Saathi scores; 2 mentors; 1 admin; 6 past mentor answers.
- Each project has one requirement left deliberately vague in the client's own words, so the "ask the client" path has something real to find.
- Token login by seeded user id. Roles: student, mentor, admin.
- **Checked:** login, `/me`, project fetch; a student requesting another project gets 403.

## Step 4: Ingest (PR #4)

- Shallow clone and fetch. Read-only `list_files`, `read_file`, `grep`.
- Skips binaries, lockfiles, files over 200 KB, and any committed `.env` that is not an example file. Strips data rows out of SQL dumps.
- Documents split by heading, meetings by groups of 6 speaker turns. Each chunk keeps a citation ref such as `brief.md#Goals` or `p1-m2@00:03:02`.
- Project card and per-file repo map written by the model; on re-sync only files whose hash changed are re-described.
- **Checked on the real `pulse` clone:** grep finds the JWT localStorage line; `../../.env` is refused; the SQL dump's 6 data blocks are removed and no email address survives.

## Step 5: Mentor agent (PR #5)

- Classifier: one of six specialisms, `project_specific` or `generic`, and whether she wants a human.
- Tools: docs search, code list/read/grep, tasks, student profile, session history, knowledge base, Exa web search.
- Hybrid search: Postgres full-text and pgvector cosine, merged by reciprocal rank fusion. Keyword-only if embeddings fail.
- Citation check: a citation or link survives only if a tool returned it during that turn.

## Step 6: Tickets and knowledge base (PR #6)

- A ticket carries the project card, student memory, what was tried, excerpts, the AI's draft answer and the full chat.
- Resolving sends the answer into the student's chat and writes a knowledge base entry.
- FYIs for sensitive topics need no reply.
- Metrics: deflection rate, and mentor minutes per ticket measured from when the mentor first opens it.

## Step 7: Chat and the escalation sequence (PR #7)

- Answer, clarify, redirect to client, one retry, then knowledge base check, then ticket.
- `scripts/flow_check.py`: the whole sequence with a scripted fake model.
- **Found by the check:** a resolved ticket's knowledge base entry had no embedding unless an API key was configured, and knowledge base search did not fall back to keywords when vector search returned nothing. Both fixed; the fix is its own commit by the owner of that code.

## Step 8: Meeting follow-up helper (PR #8), later removed

- Built: live transcript ingestion, an in-meeting helper that suggested questions for the client, and a replay script.
- **Removed** in a later PR by decision: it was judged to be bloat next to the core mentoring flow. The router, replay script and live transcript seed file are gone.
- Kept: transcripts of past client calls. They are project context the agent searches and cites.
- Kept from that PR: ingest no longer fails when an embedding call fails; chunks are stored without vectors and stay findable by keyword.

## Step 9: Memory (PR #9)

- Session log, session summary, student memory, project memory.
- Each answer records the skill gap it revealed; the memory file lists recurring struggles with counts. That section is maintained by code, not by the model, so counts cannot drift.
- Finished sessions are summarised in the background when a new session starts.
- Mentors can edit a student's memory file.

## Step 10: Deploy config (PR #10)

- Caddy with automatic HTTPS on an sslip.io hostname, systemd unit, setup and update scripts.
- **Not run.** The server is Ubuntu 22.04, 2 vCPU, 4 GB, with nothing installed. SSH worked early in the session and timed out later from the same IP, so the instance or its security group changed. Deployment is parked.

## Step 11: First run against real services (PR #11)

### Getting connected

| Service | What happened |
|---|---|
| Azure OpenAI | Three attempts. First hostname had no DNS record. Second was an AI Foundry *project* endpoint (`/api/projects/...`), which accepts Entra ID tokens only, never API keys. Working form: `https://<resource>.cognitiveservices.azure.com/openai/v1` with that resource's own key. |
| Supabase | Connection string used the `postgres://` scheme, which SQLAlchemy rejects. The config now accepts `postgres://`, `postgresql://` and `sslmode=`. |
| MongoDB Atlas | TLS handshake error, which is how Atlas refuses an IP that is not allowlisted. `0.0.0.0/32` is a single address; allow-all is `0.0.0.0/0`. |
| Exa | Worked first time. |

### API shape, settled by test

`scripts/check_llm.py` result on `gpt-5.6-luna`:

- Responses API with tools: works, full round trip.
- Chat Completions with tools: `Function tools with reasoning_effort are not supported ... use /v1/responses`.

So `LLM_API=responses`. The Chat Completions client remains for other compatible endpoints.

### Models

At first the Azure resource had `gpt-5.6-luna`, `gpt-4.1` and `gpt-4o` but no `gpt-5.6-terra`, so both roles ran on luna. Terra was deployed later and passed the same tool-calling check (works on Responses, fails on Chat Completions). `MODEL_STRONG` is now `gpt-5.6-terra`; that one line in `.env` was the whole change.

### Ingest

All three projects in 3 min 20 s: 69 chunks embedded, 3 project cards, 235 files described with none left blank, 6 knowledge base entries embedded. The p1 card picked up real decisions from the transcripts (button colour, free-shipping threshold, launch date).

### Demo path (`make smoke`)

| Question | Outcome |
|---|---|
| Where is the refresh token stored, and is that safe? | Grounded answer citing `auth.controller.js` line ranges: httpOnly cookie plus Redis |
| Client wants a "modern dashboard with analytics". Which metrics first? | `ask_client`. Cited the brief, the meeting and two tasks, and drafted a WhatsApp message offering options |
| I have no idea how Stripe webhooks work | Found the actual defect in the repo (orders are created only when the success page loads), tied it to the client's complaint in meeting 2, drew a mermaid flow, gave 3 Stripe doc links from Exa |
| Not resolved, twice | Retry took a different approach, then a ticket with a 6,116-character draft; mentor approved; knowledge base entry written |

Metrics after the run: 3 questions, 1 escalated, deflection 0.667, 1 redirected to client, 1 FYI.

### Latency

First measurement: about 33 s per answer. Stopwatch on every call inside one turn:

| Step | Time |
|---|---|
| Classifier | 3.1 s |
| Knowledge base search | 6.4 s, of which embedding 1.8 s |
| Document search | 5.1 s, of which embedding 0.8 s |
| Model, planning tool calls | 4.2 s |
| 5 file tools | 0.5 s total |
| Model, writing the answer | 7.6 s |

The model is not the bottleneck: a bare 200-word answer takes 4 s, and reasoning effort barely changes that. The database is. One round trip to Supabase is about 500 ms from here, so the project is in a distant region, and a fresh session cost 3.1 s.

Changes made:

- Knowledge base and document searches run while the classifier runs, and their results are handed to the agent up front.
- The repo map goes in the prompt instead of costing a tool round.
- The prompt asks for all tool calls in one parallel step, and answers under 300 words.
- Postgres: statement cache on for direct connections, connection recycling instead of a liveness ping on every checkout. Session cost 3.1 s to 1.5 s.

Tool rounds dropped from several to one or none. End-to-end was still about 30 s when last measured, because the remaining cost is round trips to a far-away database. **The real fix is to create the Supabase project in the same region as the server** (Singapore, `ap-southeast-1`, or Mumbai). That is a settings change, not a code change.

### Safety fix found on the way

`make check` reseeds. With `.env` pointing at hosted databases it would have wiped the ingested data. It is now pinned to the local Docker databases.

## Step 12: Database moved to Mumbai, terra switched on, meeting helper removed (PRs #12, #13)

- Supabase project recreated in Mumbai; reseeded and re-ingested. Ingest took 58 s (was 3 min 20 s): the closer database, plus repo maps already stored in Atlas, so only changed files are re-described.
- `MODEL_STRONG=gpt-5.6-terra`. Same tool-calling check as before: works on Responses, fails on Chat Completions.
- Meeting helper removed by a PR on top of the stack rather than by rewriting the branches under open PRs.

Measured after the changes:

| Measure | Before | After |
|---|---|---|
| New Postgres session | 3,150 ms, then 1,500 ms after tuning | about 300 ms |
| Code question needing file reads | about 33 s | 18 s |
| Requirement question, no tool round | about 30 s | 13 s |
| Generic Git question | not measured | 12 s |
| Full `make smoke` | 4 min 05 s | 1 min 36 s, with one step fewer |

What is left of the 12 to 18 seconds is model time: about 3 s to classify, 4 s to plan tool calls when needed, and 6 to 8 s to write the answer. The next lever is streaming the answer to the frontend, which changes how long the wait feels, not how long it is.

`make check`: 15 of 15. `make smoke`: passes. Deflection in that run: 0.833 over 6 questions.

## Step 13: ClickUp, tested against a real workspace (PR #15)

Built and verified against a real free-plan workspace, not a mock.

- `scripts.clickup_setup` created one space, four lists and 30 tasks in 1 min 16 s.
- Read path: all 30 tasks round-trip with 0 mismatches in status, due date and priority. Completing and reopening a task in ClickUp showed up on our side after a sync.
- Write path, through the running app: a student asked for her mentor; a high-priority task appeared in "Mentor support", tagged with its category. Resolving the ticket added the mentor's answer as a comment and set the task to `complete`.
- Agent: "What is pending for me this week, and what is overdue?" cited three live tasks and correctly said that a task due today is not overdue yet.

Found by testing against the real API:

| Finding | Fix |
|---|---|
| Every due date came back one day early. ClickUp stores a date-only due date as 4:00 AM in the user's timezone (Asia/Kolkata here), which is the previous day in UTC. | Dates are written and read in the workspace user's timezone, saved at setup. |
| A new space has only `to do` and `complete`, and the API answers "Status does not exist" for anything else. | `in progress` and `review` travel as tags. Setup promotes them to real statuses once the space has them. |
| `make check` would have created tasks in the real workspace once ClickUp was enabled in `.env`. | The check pins `CLICKUP_ENABLED=false`. |

Found on the way, unrelated to ClickUp: the Supabase direct host is IPv6-only. It worked until this machine moved to an IPv4-only network, then failed with "Network is unreachable". `.env` now uses the session pooler, which works on both. `.env.example` says so.

To make the ClickUp board columns match for a demo, add `in progress` and `review` as statuses on the space (Space settings > Statuses), then run the setup script again.

## Known gaps

| Gap | Note |
|---|---|
| Model provider down | `/chat` returns 500. Should reply plainly and offer escalation |
| Secrets pasted into chat | Stored as typed. Should be scrubbed before saving |
| Instructions hidden in a repo or transcript | Tools are read-only and citations are validated, but the prompt does not yet tell the model to distrust that content |
| Off-topic questions | Agent would answer them |
| Mentor never replies | Assumed not to happen, by decision |
| Session summaries | Searched by keyword, not embedded |
| Rate limits, private repos, non-English input | Roadmap |
| The API key was pasted into a chat transcript during setup | Regenerate it in the Azure portal after the event |
