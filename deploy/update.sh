#!/usr/bin/env bash
# Pull the latest code and restart the API. Run from the repo root on the server.
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"

git pull --ff-only
cd backend
uv sync --no-dev
sudo systemctl restart mentor-api
sleep 2
curl -fsS http://127.0.0.1:8000/api/health && echo
