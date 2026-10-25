# Деплой

Схема: GitHub Actions собирает образы `api` и `web` на каждый merge в `main`, проверяет их
настоящим prod-стеком (HTTPS через Caddy, миграции, health) и публикует в GHCR:

- `ghcr.io/slvtveter/startup-platform-api:main` и `:sha-xxxxxxx`
- `ghcr.io/slvtveter/startup-platform-web:main` и `:sha-xxxxxxx`

Выкатка на сервер — workflow **Deploy** (Actions → Deploy → Run workflow), только вручную
и только через GitHub Environment с подтверждением человеком.

## Какой сервер нужен

Замер prod-стека (`compose.prod.yml`, демо-данные, 2026-10-24):

| Контейнер | Память в покое | Под нагрузкой* | CPU под нагрузкой |
|---|---|---|---|
| web (Next SSR) | 47 МБ | 121 МБ | ~1 ядро |
| api (FastAPI) | 149 МБ | 159 МБ | ~0.6 ядра |
| db (Postgres) | 69 МБ | 90 МБ | ~0.8 ядра |
| worker | 62 МБ | 62 МБ | — |
| caddy | 26 МБ | 37 МБ | ~0.2 ядра |
| **Итого** | **~355 МБ** | **~470 МБ** | |

\* 1600 SSR-запросов в 20 потоков. После нагрузки `/startups` отвечает за 16 мс.

Образы занимают около 1.5 ГБ диска, ещё нужно место под логи (ротация 5 × 10 МБ на контейнер), бэкапы (14 дней) и аватары.

- **Старт: 1 vCPU / 2 ГБ / 50 ГБ, Ubuntu 24.04 LTS, swap 2 ГБ.** Памяти хватает с запасом в 4 раза. При всплеске трафика упрёмся в CPU — сайт станет медленнее, но не упадёт.
- **2 vCPU / 4 ГБ** — когда на одном сервере нужен ещё staging (второй стек, около 0.5 ГБ) или когда под реальной нагрузкой растёт время ответа.
- Сервер должен работать постоянно: иначе не уходят письма, не продлевается HTTPS-сертификат и не делаются бэкапы.

## Первичная настройка сервера (один раз)

1. Ubuntu 24.04, открыты только порты 22, 80 и 443. Docker — по [официальной инструкции](https://docs.docker.com/engine/install/ubuntu/).
   ```bash
   # swap 2 ГБ: страховка от нехватки памяти на тарифе с 2 ГБ
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   # файрвол
   sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
   ```
   Docker публикует порты в обход ufw, поэтому наружу открыт только Caddy: у остальных сервисов в `compose.prod.yml` нет `ports`.
   SSH только по ключу и автообновления безопасности (боты перебирают пароли к SSH с первого часа):
   ```bash
   # сначала: ssh-copy-id user@сервер и проверить, что вход по ключу работает
   # отдельный файл с префиксом 00: побеждает первое значение, а конфиг провайдера (50-cloud-init.conf) может включать пароли
   printf 'PasswordAuthentication no\nPermitRootLogin no\n' | sudo tee /etc/ssh/sshd_config.d/00-hardening.conf
   sudo sshd -t && sudo systemctl restart ssh
   sudo apt install -y unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades
   ```
2. DNS: A-записи `@` и `www` на IP сервера (prod: envola.ru → 195.58.56.117). HTTPS-сертификаты для обоих Caddy выпустит сам, www редиректит на основной домен.
3. На сервере:
   ```bash
   sudo mkdir -p /opt/startup-platform && sudo chown $USER /opt/startup-platform
   cd /opt/startup-platform
   # скопировать сюда infra/compose.prod.yml, Caddyfile.prod, папку backup (или дождаться первого деплоя)
   cp .env.prod.example .env.prod   # заполнить: домен, пароль БД, SMTP, SECRET_KEY и EVENTS_SALT (openssl rand -hex 32)
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
- Файлы (аватары) лежат рядом: `backups/media-<время>.tar.gz`. Восстановить:
  `docker compose -f compose.prod.yml --env-file .env.prod run --rm -v "$PWD/backups:/b" --entrypoint sh api -c "tar -xzf /b/media-<время>.tar.gz -C /media"`.
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
