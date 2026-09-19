# Team-21

AI mentor for Barabari Collective students working on freelance client projects. Code for Good 2026, Hyderabad.

## Docs

- [`docs/design.md`](docs/design.md): decisions, architecture, API contract, data shapes
- [`CONTEXT.md`](CONTEXT.md): glossary
- [`docs/project-scope/`](docs/project-scope/): challenge statement, Q&A transcript, sample questions

## Setup

```sh
make hooks                         # install the pre-commit hook, once
cp backend/.env.example backend/.env   # then fill in the keys
make seed
make dev
```

## Layout

- `backend/`: FastAPI service
- `frontend/`: React app (separate team)
- `scripts/`: git hooks
