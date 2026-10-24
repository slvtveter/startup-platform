from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_settings

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


class OriginCheckMiddleware(BaseHTTPMiddleware):
    """Вместе с SameSite=Lax cookie защищает от CSRF: чужой сайт не сможет слать POST."""

    async def dispatch(self, request: Request, call_next):
        if request.method not in SAFE_METHODS:
            origin = request.headers.get("origin")
            if origin and origin not in get_settings().allowed_origins:
                return JSONResponse(
                    {
                        "error": {
                            "code": "forbidden",
                            "message": "Недопустимый Origin",
                            "details": None,
                        }
                    },
                    status_code=403,
                )
        return await call_next(request)
