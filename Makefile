COMPOSE := docker compose -f infra/docker-compose.yml

.PHONY: help setup dev down logs test lint fmt migrate migration gen-client seed create-admin restart-worker

help: ## Показать команды
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-12s %s\n", $$1, $$2}'

setup: ## Установить зависимости локально (uv + npm)
	@test -f infra/.env || cp infra/.env.example infra/.env
	cd apps/api && uv sync
	cd apps/web && npm ci

dev: ## Поднять всё в Docker: http://localhost:8080
	@test -f infra/.env || cp infra/.env.example infra/.env
	$(COMPOSE) up --build -d
	@echo "web: http://localhost:8080  api docs: http://localhost:8080/api/docs  mail: http://localhost:8025"

down: ## Остановить контейнеры
	$(COMPOSE) down

logs: ## Логи всех сервисов
	$(COMPOSE) logs -f --tail=100

test: ## Тесты API (нужен Postgres: make dev или $(COMPOSE) up -d db)
	cd apps/api && uv run pytest -q

lint: ## Линтеры и проверка типов
	cd apps/api && uv run ruff check . && uv run ruff format --check .
	cd apps/web && npm run lint && npm run typecheck

fmt: ## Автоформатирование
	cd apps/api && uv run ruff format . && uv run ruff check --fix .

migrate: ## Применить миграции к локальной БД
	cd apps/api && uv run alembic upgrade head

migration: ## Создать миграцию: make migration m="add profiles"
	cd apps/api && uv run alembic revision --autogenerate -m "$(m)"

gen-client: ## Перегенерировать TS-клиент из OpenAPI схемы FastAPI
	cd apps/api && uv run python -c "import json; from app.main import app; print(json.dumps(app.openapi(), indent=2))" > ../web/openapi.json
	cd apps/web && npm run gen:client

seed: ## Демо-данные (синтетика): make seed
	$(COMPOSE) exec api python -m app.scripts.seed

create-admin: ## Выдать права админа: make create-admin email=you@example.com
	$(COMPOSE) exec api python -m app.scripts.create_admin $(email)

restart-worker: ## Перезапустить воркер фоновых задач после правок в apps/api
	docker compose -f infra/docker-compose.yml restart worker
