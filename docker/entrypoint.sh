#!/bin/sh
set -e

echo "[entrypoint] Vault-Registry initialisieren..."
node /app/docker/registry-init.js

echo "[entrypoint] obsidian-web Backend intern starten (Port ${INTERNAL_PORT:-3001})..."
cd /app/src/runtime-server/server
PORT="${INTERNAL_PORT:-3001}" HOST=127.0.0.1 npm start &
APP_PID=$!

cd /app
echo "[entrypoint] Auto-Open-Proxy öffentlich starten (Port ${PORT:-3000})..."
node /app/docker/proxy.js &
PROXY_PID=$!

trap 'kill -TERM $APP_PID $PROXY_PID 2>/dev/null' TERM INT
wait $APP_PID $PROXY_PID
