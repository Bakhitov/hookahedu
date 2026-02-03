#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SERVER_PORT="${SERVER_PORT:-4000}"
WEB_PORT="${WEB_PORT:-5174}"

cd "$ROOT_DIR"

if command -v docker >/dev/null 2>&1; then
  docker compose up -d postgres
else
  echo "Docker not found. Please start Postgres manually or install Docker." >&2
  exit 1
fi

if [ ! -f "$ROOT_DIR/server/.env" ]; then
  cp "$ROOT_DIR/server/.env.example" "$ROOT_DIR/server/.env"
  echo "Created server/.env from example. Fill required secrets before login flows." >&2
fi

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  npm install
fi

if [ ! -d "$ROOT_DIR/server/node_modules" ]; then
  (cd "$ROOT_DIR/server" && npm install)
fi

(cd "$ROOT_DIR/server" && npm run db:migrate)

cleanup() {
  if [ -n "${SERVER_PID:-}" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" || true
  fi
  if [ -n "${WEB_PID:-}" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" || true
  fi
}
trap cleanup EXIT INT TERM

(cd "$ROOT_DIR/server" && PORT="$SERVER_PORT" npm run dev) &
SERVER_PID=$!

cd "$ROOT_DIR"
npm run dev -- --host 0.0.0.0 --port "$WEB_PORT" &
WEB_PID=$!

echo "API: http://localhost:${SERVER_PORT}"
echo "WEB: http://localhost:${WEB_PORT}"

wait "$SERVER_PID" "$WEB_PID"
