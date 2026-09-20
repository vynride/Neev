.PHONY: hooks db dev seed ingest demo check smoke

# Install the repo's git hooks (run once after cloning)
hooks:
	chmod +x scripts/pre-commit
	git config core.hooksPath scripts

# Local Postgres and MongoDB, for development without the hosted databases
db:
	docker compose -f docker-compose.dev.yml up -d

dev:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

seed:
	cd backend && uv run python -m app.seed

# Needs LLM keys: chunks and embeds docs, writes project cards, clones and maps the repos
ingest:
	cd backend && uv run python -m app.ingest.pipeline

# Escalation flow with a fake LLM: needs `make db`, not keys.
# It reseeds (a knowledge base entry left by an earlier run would answer the test question),
# so it is pinned to the local Docker databases and can never wipe the hosted ones in .env.
# ClickUp is switched off for it too: a test must not create tasks in a real workspace.
LOCAL_DB = DATABASE_URL=postgresql+asyncpg://mentor@localhost:5432/mentor MONGO_URL=mongodb://localhost:27017 CLICKUP_ENABLED=false
check:
	cd backend && $(LOCAL_DB) uv run python -W ignore -m app.seed
	cd backend && $(LOCAL_DB) uv run python -W ignore -m scripts.flow_check

# Demo path against a running server with real models
smoke:
	cd backend && uv run python -m scripts.smoke

# A fortnight of realistic chats, tickets and metrics, so the demo does not start empty
demo:
	cd backend && uv run python -W ignore -m scripts.demo_activity $(ARGS)
