# Деплой

Схема: GitHub Actions собирает образы `api` и `web` на каждый merge в `main`, проверяет их
настоящим prod-стеком (HTTPS через Caddy, миграции, health) и публикует в GHCR:

- `ghcr.io/slvtveter/startup-platform-api:main` и `:sha-xxxxxxx`
- `ghcr.io/slvtveter/startup-platform-web:main` и `:sha-xxxxxxx`

Выкатка на сервер — workflow **Deploy** (Actions → Deploy → Run workflow), только вручную
и только через GitHub Environment с подтверждением человеком.

## Первичная настройка сервера (один раз)

1. VPS с Docker (Ubuntu 24.04, 2 vCPU / 4 ГБ для старта), открыты порты 80 и 443.
2. DNS: A-запись домена на IP сервера. HTTPS-сертификат Caddy выпустит сам.
3. На сервере:
   ```bash
   sudo mkdir -p /opt/startup-platform && sudo chown $USER /opt/startup-platform
   cd /opt/startup-platform
   # скопировать сюда infra/compose.prod.yml, Caddyfile.prod, папку backup (или дождаться первого деплоя)
   cp .env.prod.example .env.prod   # и заполнить: домен, пароль БД, SMTP
   echo $GHCR_TOKEN | docker login ghcr.io -u <github-user> --password-stdin   # если пакеты приватные
   docker compose -f compose.prod.yml --env-file .env.prod up -d
   docker compose -f compose.prod.yml --env-file .env.prod exec api python -m app.scripts.create_admin you@example.com
   ```
4. В GitHub → Settings → Environments создать `staging` и `production`:
   - Required reviewers: хранитель прода.
   - Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (отдельный ключ только для деплоя).
   - Variable (опционально): `DEPLOY_PATH` (по умолчанию `/opt/startup-platform`).

## Выкатка и откат

- Выкатить: Actions → Deploy → environment, `image_tag` = `main` или конкретный `sha-xxxxxxx`.
- Откатить: тот же workflow с предыдущим `sha-...` (теги неизменяемые).
- Миграции применяются автоматически при старте контейнера `api`. Откат схемы — только руками
  хранителя схемы (`alembic downgrade`), поэтому миграции пишем обратно совместимыми.

## Staging

Тот же `compose.prod.yml` на отдельном сервере или в отдельной папке со своим `.env.prod`:
`STACK=staging`, `CADDYFILE=Caddyfile.staging` (basic auth и noindex), отдельная БД.
Данные только синтетические: `docker compose ... exec api python -m app.scripts.seed`.

## Бэкапы

- Контейнер `backup` делает `pg_dump -Fc` раз в сутки в `${BACKUP_DIR}` и хранит 14 дней.
- Копия вне сервера: cron на хосте, например `rclone copy /opt/startup-platform/backups remote:backups`.
- Восстановление (перезаписывает базу):
  ```bash
  docker compose -f compose.prod.yml --env-file .env.prod exec backup sh /scripts/restore.sh /backups/<файл>.dump
  ```
- Раз в месяц проверяйте восстановление на отдельной машине.

## Напоминания об откликах

Раз в сутки (cron на хосте):
```bash
```

## Мониторинг (TODO, нужен второй сервер)

GlitchTip для ошибок и Uptime Kuma для доступности ставятся на отдельный сервер,
чтобы замечать падение основного. См. задачу KAN-22.

## Фоновые задачи

Сервис `worker` (`python -m app.worker`) разбирает очередь `jobs`: письма отправляются с повторами (1, 2, 4, 8 минут, после 5 неудач задача помечается упавшей) и раз в час идут напоминания основателям. Cron для `app.scripts.remind` больше не нужен. Очередь и упавшие задачи видны в `/admin`.
