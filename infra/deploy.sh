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
    # Ровно healthy: grep по тексту совпал бы и с unhealthy.
    if [ "$($C ps api --format '{{.Health}}')" = "healthy" ] &&
      $C exec -T api python -c "import urllib.request; urllib.request.urlopen('http://web:3000/', timeout=5)" 2>/dev/null; then
      return 0
    fi
    sleep 3
  done
  return 1
}

# Образы релизов копятся (~300 МБ на релиз) и забивают диск: оставляем 5 последних каждого
# сервиса — их хватает для отката. Образ, который сейчас запущен, docker удалить не даст.
prune_old_images() {
  for svc in api web; do
    docker images --format '{{.CreatedAt}}|{{.Repository}}:{{.Tag}}' |
      grep "startup-platform-$svc:sha-" | sort -r | tail -n +6 | cut -d'|' -f2 |
      xargs -r docker rmi > /dev/null 2>&1 || true
  done
  docker image prune -f > /dev/null
}

# Кеш оптимизированных картинок Next живёт внутри контейнера web и пропадает при выкатке.
# Прогреваем его сразу: запрашиваем все /_next/image с ключевых страниц, чтобы первый
# посетитель получил готовые файлы, а не ждал, пока сервер их пережмёт.
warm_images() {
  $C exec -T api python - <<'PY'
import html, re, urllib.request

def get(url, accept="text/html"):
    req = urllib.request.Request("http://web:3000" + url, headers={"Accept": accept})
    return urllib.request.urlopen(req, timeout=30).read()

urls = set()
for page in ["/", "/ideas", "/startups", "/people", "/people/cofounders", "/login", "/register"]:
    try:
        body = html.unescape(get(page).decode())
    except Exception:
        continue
    urls.update(re.findall(r'/_next/image\?url=[^"\s,]+', body))
for u in sorted(urls):
    get(u, "image/avif,image/webp,image/*")
print(f"warmed {len(urls)} images")
PY
}

export IMAGE_TAG="$TAG"
$C pull api web

# Бэкап до миграций нового релиза. Не получился — не выкатываем.
if [ -n "$($C ps -q --status running db)" ]; then
  $C run --rm --no-deps --entrypoint /bin/sh backup /scripts/backup.sh
fi

$C up -d --remove-orphans
if healthy; then
  # Справочник ролей и навыков: без него в профиле нечего выбрать. Идемпотентно.
  $C exec -T api python -m app.scripts.catalog || echo "catalog step failed (old image?)" >&2
  warm_images || echo "image warm-up failed" >&2
  echo "$TAG" > .deployed-tag
  prune_old_images
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
