#!/usr/bin/env bash
set -euo pipefail
IMAGE_PREFIX="${1:?Image prefix required}"
IMAGE_TAG="${2:?Image tag required}"
cd "$HOME/spicehouse"
test -f .env || { echo 'Create ~/spicehouse/.env first'; exit 1; }
# The server must already be logged into GHCR if the packages are private.
export IMAGE_PREFIX IMAGE_TAG
printf 'Deploying %s at %s\n' "$IMAGE_PREFIX" "$IMAGE_TAG"
docker compose pull
# Do not build on the server: only run images published by the tested workflow.
docker compose up -d --no-build --remove-orphans
source .env
for attempt in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${WEB_PORT:-8080}/api/health" | grep -q '"ok"'; then
    printf '%s\n' "$IMAGE_PREFIX $IMAGE_TAG" > last-deployed.txt
    echo 'Deployment healthy'
    exit 0
  fi
  sleep 2
done
echo 'Deployment unhealthy; inspect docker compose logs' >&2
exit 1
