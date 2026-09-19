.PHONY: hooks db dev seed ingest check smoke

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

# Escalation flow with a fake LLM: needs the databases, not keys
check:
	cd backend && uv run python -W ignore -m scripts.flow_check

# Demo path against a running server with real models
smoke:
	cd backend && uv run python -m scripts.smoke
