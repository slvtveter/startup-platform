from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.routers import health


def _operation_id(route: APIRoute) -> str:
    # Короткие operationId -> аккуратные имена функций в сгенерированном TS-клиенте.
    return route.name


# Всё API живёт под /api: Caddy проксирует этот префикс на FastAPI,
# остальное отдаёт Next.js — один origin, без CORS.
app = FastAPI(
    title="Startup Platform API",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url=None,
    generate_unique_id_function=_operation_id,
)

app.include_router(health.router, prefix="/api")
