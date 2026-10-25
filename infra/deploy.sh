#!/bin/sh
# Выкатка на сервере: sh deploy.sh <тег образа>. Запускается из workflow Deploy, можно и руками.
# Порядок: бэкап базы → новые образы (миграции применяются при старте api) → проверка → при сбое откат.
set -eu
TAG=${1:?"usage: deploy.sh <image tag>"}
cd "$(dirname "$0")"
C="docker compose -f compose.prod.yml --env-file .env.prod"
PREV=$(cat .deployed-tag 2>/dev/null || true)

healthy() {
  for _ in $(seq 1 40); do
    if $C ps api | grep -q healthy &&
      $C exec -T api python -c "import urllib.request; urllib.request.urlopen('http://web:3000/', timeout=5)" 2>/dev/null; then
      return 0
    fi
    sleep 3
  done
  return 1
}

export IMAGE_TAG="$TAG"
$C pull api web

# Бэкап до миграций нового релиза. Не получился — не выкатываем.
if $C ps --status running db | grep -q db; then
  $C run --rm --no-deps --entrypoint /bin/sh backup /scripts/backup.sh
fi

$C up -d --remove-orphans
if healthy; then
  echo "$TAG" > .deployed-tag
  docker image prune -f > /dev/null
  echo "deployed $TAG"
  exit 0
fi

echo "release $TAG is unhealthy" >&2
$C logs --tail=100 api web >&2
if [ -n "$PREV" ] && [ "$PREV" != "$TAG" ]; then
  # Схему назад не откатываем: миграции обратно совместимы, старый код работает с новой схемой.
  echo "rolling back to $PREV" >&2
  IMAGE_TAG="$PREV" $C up -d --remove-orphans
  healthy && echo "rolled back to $PREV" >&2
fi
exit 1
