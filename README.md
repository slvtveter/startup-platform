# Startup Platform

Платформа, где стажёры и выпускники в IT находят стартапы для первого реального опыта, а основатели — команду.

**Стек:** Next.js + Tailwind + shadcn/ui · FastAPI + SQLAlchemy 2 + Alembic · PostgreSQL 17 · Caddy · Docker Compose.

## Быстрый старт
Нужны Docker, [uv](https://docs.astral.sh/uv/) и Node 22.

```bash
make setup   # зависимости
make dev     # всё в Docker
```

- Сайт: http://localhost:8080
- API docs (Swagger): http://localhost:8080/api/docs
- Почта (Mailpit): http://localhost:8025

Демо-данные: `make seed`. Аккаунты (пароль `demo12345`):

| Email | Роль |
|---|---|
| `maria@example.com` | дизайнер, ищет первый опыт |
| `alina@example.com` | основатель «ВкусноРядом», есть входящие отклики |
| `admin@example.com` | администратор (`/admin`) |

Тесты: `make test` (API, pytest), `cd apps/web && npx playwright test` (E2E, нужен `make dev` + `make seed`).

Остальные команды: `make help`. Деплой: [docs/deploy.md](docs/deploy.md). События аналитики: [docs/events.md](docs/events.md). Правила работы: [AGENTS.md](AGENTS.md). Описание продукта: [docs/startup-idea.md](docs/startup-idea.md).
