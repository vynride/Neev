#!/usr/bin/env bash
# One-time setup on the Ubuntu EC2 box. Run from the repo root on the server:
#   SITE_HOST=13-229-64-14.sslip.io ./deploy/setup.sh
# Requires backend/.env to exist already (copy it over with scp; it is never in git).
set -euo pipefail

: "${SITE_HOST:?Set SITE_HOST, e.g. 13-229-64-14.sslip.io}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$REPO_DIR/backend/.env" ]; then
  echo "backend/.env is missing. Copy it to the server first." >&2
  exit 1
fi

if ! command -v uv >/dev/null; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$PATH"

if ! command -v caddy >/dev/null; then
  sudo apt-get update -y
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' |
    sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' |
    sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y caddy
fi

cd "$REPO_DIR/backend"
uv sync --no-dev
uv run python -m app.seed
uv run python -m app.ingest.pipeline

sudo cp "$REPO_DIR/deploy/mentor-api.service" /etc/systemd/system/mentor-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now mentor-api

sudo sed "s/{\$SITE_HOST}/$SITE_HOST/" "$REPO_DIR/deploy/Caddyfile" | sudo tee /etc/caddy/Caddyfile >/dev/null
sudo systemctl reload caddy || sudo systemctl restart caddy

echo "Deployed. Check: curl https://$SITE_HOST/api/health"
