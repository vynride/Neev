.PHONY: hooks dev seed smoke

# Install the repo's git hooks (run once after cloning)
hooks:
	chmod +x scripts/pre-commit
	git config core.hooksPath scripts

dev:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

seed:
	cd backend && uv run python -m app.seed

smoke:
	cd backend && uv run python scripts/smoke.py
