#!/bin/sh

set -eu

docker compose \
  --env-file .env.development \
  -f compose.development.yaml \
  down --volumes --remove-orphans --rmi all

docker ps -aq \
  --filter 'name=notification-preference' \
  | xargs -r docker rm -f

docker volume ls -q \
  | grep -E '^notification-preference(s)?-service_' \
  | xargs -r docker volume rm -f

docker network ls --format '{{.Name}}' \
  | grep -E '^notification-preference(s)?-service_' \
  | xargs -r docker network rm
