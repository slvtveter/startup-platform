# Деплой

Схема: **merge в `main` = релиз в прод.** GitHub Actions на каждый merge собирает образы `api` и `web`,
проверяет их настоящим prod-стеком (HTTPS через Caddy, миграции, health), публикует в GHCR и сразу выкатывает:

- `ghcr.io/slvtveter/startup-platform-api:sha-xxxxxxx` (и `:main`)
- `ghcr.io/slvtveter/startup-platform-web:sha-xxxxxxx` (и `:main`)

Выкатка (`infra/deploy.sh` на сервере):
1. `pg_dump` базы и архив аватаров в `backups/` — до миграций нового релиза. Бэкап не удался — релиз не выкатывается.
2. Новые образы, миграции применяются при старте `api`.
3. Проверка: `api` healthy и `web` отвечает. Затем дозаполняется справочник ролей и навыков (`app.scripts.catalog`). Не поднялось за 2 минуты — автоматический откат на прошлый тег
   (он хранится в `.deployed-tag`). Схему назад не откатываем, поэтому миграции пишем обратно совместимыми.

Отдельных веток `prod`/`dev` нет: в прод уходит тот же образ, что прошёл проверки. Незаконченное прячем за флагом.
Staging (`staging.envola.ru`, автодеплой из `main`, прод — кнопкой тем же образом) включим, когда появятся
живые пользователи и рискованные миграции; для двух стеков нужен сервер с 4 ГБ.

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
4. В GitHub → Settings → Environments создать `production`:
   - Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (отдельный ключ только для деплоя),
     `DEPLOY_KNOWN_HOSTS` (`ssh-keyscan -H <host>`: workflow проверяет, что подключается к своему серверу).
   - Variable (опционально): `DEPLOY_PATH` (по умолчанию `/opt/startup-platform`).
   - Required reviewers на бесплатном тарифе для приватного репо недоступны; ворота — merge PR.

## Выкатка и откат

- Выкатить: merge PR в `main`. Ход выкатки — в Actions → CI → job `deploy`.
- PR можно мержить подряд, не дожидаясь выкатки предыдущего: ветка не обязана быть свежей (защита `main` без strict), а прогон на `main` всё равно проверяет всё вместе (api, web, e2e в двух шардах, prod-образы) перед деплоем. Выкатывается только последний коммит `main` (job `latest`), промежуточные прогоны деплой пропускают.
- Откатить: Actions → Deploy → Run workflow, `image_tag` = предыдущий `sha-xxxxxxx` (теги неизменяемые).
- Руками на сервере: `sh /opt/startup-platform/deploy.sh sha-xxxxxxx`.
- Откат схемы — только руками хранителя схемы (`alembic downgrade`).

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

## Справочник и примеры на пустом проде

- Роли и навыки: `docker compose -f compose.prod.yml --env-file .env.prod exec api python -m app.scripts.catalog`.
  Идемпотентно, уже существующие записи не трогает.
- Примеры (3 стартапа и 7 человек с пометкой «Пример»): `... exec api python -m app.scripts.demo add`.
  Почта у них `@demo.invalid`: войти нельзя, писем нет, откликнуться, пригласить и написать нельзя.
  Когда появятся настоящие стартапы: `... exec api python -m app.scripts.demo remove` — удалит и аватарки.

## Вход через Telegram и VK ID

Код готов, кнопки появятся сами, когда в `/opt/startup-platform/.env.prod` будут ключи (после правки — `export IMAGE_TAG=$(cat .deployed-tag)` и `docker compose -f compose.prod.yml --env-file .env.prod up -d api`):

- **Telegram:** создать бота у @BotFather, токен → `TELEGRAM_BOT_TOKEN=...`; там же `/setdomain` → `envola.ru`.
- **VK ID:** приложение на id.vk.com/business (тип «Веб»), доверенный redirect URL `https://envola.ru/api/auth/vk/callback`, ID приложения → `VK_CLIENT_ID=...`.

Вошедшие так пользователи получают служебный email `…@users.invalid` (писем на него нет), почту можно указать в настройках.

## Почта: чтобы письма не уходили в спам и «Промоакции»

Отправка — smtp.bz (`connect.smtp.bz:587`, STARTTLS), адрес `noreply@envola.ru`. DNS (проверено 2026-11-01):
SPF `v=spf1 a mx include:spf.smtp.bz ~all`, DKIM `smtpbz._domainkey`, DMARC `v=DMARC1; p=none;`.

Gmail раскладывает письма по вкладкам по их виду. Шаблон `apps/api/app/templates/email.html` нарочно похож на обычное письмо:
белый фон, логотип текстом, без картинок, слоганов и «карточек», простая прямоугольная кнопка. Не добавляй в служебные письма
(коды, подтверждение почты, сброс пароля) баннеры, картинки и маркетинговые тексты — иначе они уедут в «Промоакции».
Если письма всё равно попадают туда — проверь в кабинете smtp.bz, что выключены отслеживание открытий и подмена ссылок.
Когда наберётся история отправок, DMARC можно ужесточить до `p=quarantine`.
