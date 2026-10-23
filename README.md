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

Остальные команды: `make help`. Правила работы: [AGENTS.md](AGENTS.md). Описание продукта: [docs/startup-idea.md](docs/startup-idea.md).
