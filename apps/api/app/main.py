from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.core.config import get_settings
from app.core.csrf import OriginCheckMiddleware
from app.core.errors import register_error_handlers
from app.core.logging import RequestContextMiddleware, setup_logging
from app.routers import (
    admin,
    applications,
    auth,
    catalog,
    chats,
    health,
    notifications,
    ops,
    profiles,
    startups,
    testing,
)


def _operation_id(route: APIRoute) -> str:
    # Короткие operationId -> аккуратные имена функций в сгенерированном TS-клиенте.
    return route.name


setup_logging()
# Swagger и схема API нужны при разработке; в prod не показываем карту всех ручек.
_docs = get_settings().env in ("local", "test")

# Всё API живёт под /api: Caddy проксирует этот префикс на FastAPI,
# остальное отдаёт Next.js — один origin, без CORS.
app = FastAPI(
    title="Startup Platform API",
    openapi_url="/api/openapi.json" if _docs else None,
    docs_url="/api/docs" if _docs else None,
    redoc_url=None,
    generate_unique_id_function=_operation_id,
)
app.add_middleware(OriginCheckMiddleware)
app.add_middleware(RequestContextMiddleware)
register_error_handlers(app)

for module in (
    health,
    auth,
    catalog,
    profiles,
    startups,
    applications,
    chats,
    notifications,
    ops,
    admin,
    testing,
):
    app.include_router(module.router, prefix="/api")
