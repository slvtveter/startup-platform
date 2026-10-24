# AGENTS.md

Правила для людей и AI-агентов, работающих в этом репозитории.

## Что это
Веб-платформа, где стажёры и выпускники в IT находят стартапы для первого опыта, а основатели собирают команду. Контекст продукта: `docs/startup-idea.md`.

## Структура
- `apps/api` — FastAPI (Python 3.13, uv), SQLAlchemy 2 async, Alembic. **Вся бизнес-логика и авторизация здесь.**
- `apps/web` — Next.js (App Router, TS), Tailwind, shadcn/ui. Только UI и SSR. Перед правками прочитай `apps/web/AGENTS.md` (версия Next новее, чем знают модели).
- `infra` — Docker Compose, Caddyfile. Caddy: `/api/*` → api, остальное → web.
- `docs` — продукт и исследования.

## Команды
`make setup`, `make dev`, `make seed`, `make test`, `make lint`, `make fmt`, `make migration m="..."`, `make migrate`, `make gen-client`, `make create-admin email=...`.
E2E: `cd apps/web && npx playwright test` (против `make dev` + `make seed`). Деплой: `docs/deploy.md`.

## Правила
1. **У агентов нет доступа к проду и staging**: никаких ключей БД, SSH, prod-секретов. Деплой только из CI после merge в `main` и подтверждения человеком.
2. Работа через ветку + PR. Прямые push в `main` запрещены. CI должен быть зелёным.
3. **Миграции БД** создаёт агент, но мержит только «хранитель схемы» (человек) после ревью. Не редактировать уже применённые миграции.
4. **Новые зависимости** — только с явным упоминанием в PR (проверить, что пакет реально существует и популярен: защита от slopsquatting).
5. Секреты только в `.env` (в git не попадают). Шаблон — `infra/.env.example`.
6. Изменил API (роуты/схемы) → `make gen-client` и закоммить `apps/web/openapi.json` + `apps/web/src/lib/api`. Руками сгенерированный клиент не правим.
7. Во фронте никаких внешних скриптов, CDN, трекеров и шрифтов с чужих серверов (`next/font` скачивает шрифты на этапе сборки — это ок).
8. Реальные пользовательские данные в local/staging не копировать — только синтетика.
9. Новый эндпоинт = Pydantic-схемы в `app/schemas`, логика в `app/services`, роутер в `app/routers`, тест в `tests`.
10. Ошибки API бросаем через `app.core.errors` (NotFound, Forbidden, Conflict, AppError): формат ответа единый.
11. Списки отдаём как `Page[T]` (`items`, `total`, `limit`, `offset`), фильтры — повторяющимися query-параметрами (`?role=a&role=b`).
12. Новое событие воронки — `track()` в сервисе + строка в `docs/events.md`.
13. Async SQLAlchemy: ленивых загрузок нет. Связи грузим жадно (`lazy="selectin"/"joined"`), у новых объектов инициализируем коллекции.

## Владельцы модулей
- Ядро, auth, профили — основатель-программист.
- Подбор (matching) — ML-специалист.
- Публичные страницы / SEO — SEO-разработчик.
