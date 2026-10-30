# Envola

Веб-платформа, где начинающие в IT обсуждают идеи, находят сообщников и собираются в команды стартапов.

## Стек

| Часть | Технологии |
|---|---|
| Фронтенд | Next.js 16 (App Router, SSR), React 19, TypeScript, Tailwind CSS 4, shadcn/ui на Base UI |
| Бэкенд | Python 3.13, FastAPI, SQLAlchemy 2 (async) + asyncpg, Alembic, Pydantic |
| База | PostgreSQL 17, полнотекстовый поиск на `tsvector` |
| Фоновые задачи | Очередь в Postgres и отдельный воркер (письма, напоминания, дайджесты) |
| Почта | SMTP; локально — Mailpit |
| Файлы | Локальное хранилище (Docker volume), картинки режутся в WebP через Pillow |
| Инфраструктура | Docker Compose, Caddy (HTTPS, прокси `/api` → FastAPI, остальное → Next.js) |
| Качество | Ruff, ESLint, pytest, Playwright (E2E и a11y), GitHub Actions |

API-клиент для фронта генерируется из OpenAPI-схемы FastAPI (`@hey-api/openapi-ts`).

## Структура

```
apps/api   FastAPI: модели, схемы, сервисы, роутеры, миграции, тесты
apps/web   Next.js: страницы, компоненты, сгенерированный API-клиент, E2E
infra      Docker Compose, Caddyfile, скрипты деплоя и бэкапов
docs       Архитектура, деплой, безопасность, события аналитики
```

## Запуск локально

Нужны Docker, [uv](https://docs.astral.sh/uv/) и Node 22.

```bash
make setup   # зависимости
make dev     # всё в Docker
make seed    # демо-данные
```

- Сайт: http://localhost:8080
- Swagger: http://localhost:8080/api/docs
- Почта (Mailpit): http://localhost:8025

## Команды

```bash
make test                          # тесты API (pytest)
make lint / make fmt               # линтеры и форматирование
make migration m="..."             # новая миграция Alembic
make gen-client                    # обновить TS-клиент после изменений API
cd apps/web && npx playwright test # E2E (нужны make dev и make seed)
```

Все команды — `make help`.

## Документация

- [docs/architecture.md](docs/architecture.md) — как устроена система
- [docs/deploy.md](docs/deploy.md) — деплой
- [docs/security.md](docs/security.md) — безопасность
- [docs/seo.md](docs/seo.md) — SEO: посадочные, canonical, sitemap, Вебмастер
- [docs/events.md](docs/events.md) и [docs/analytics.md](docs/analytics.md) — события воронки и Яндекс Метрика
- [docs/ux/design-system.md](docs/ux/design-system.md) — дизайн-система
- [docs/research/](docs/research/) — разборы конкурентов
- [AGENTS.md](AGENTS.md) — правила работы с репозиторием
