from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.core.csrf import OriginCheckMiddleware
from app.core.errors import register_error_handlers
from app.core.logging import RequestContextMiddleware, setup_logging
from app.routers import (
    admin,
    applications,
    auth,
    catalog,
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

# Всё API живёт под /api: Caddy проксирует этот префикс на FastAPI,
# остальное отдаёт Next.js — один origin, без CORS.
app = FastAPI(
    title="Startup Platform API",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
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
    notifications,
    ops,
    admin,
    testing,
):
    app.include_router(module.router, prefix="/api")
