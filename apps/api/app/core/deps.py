from typing import Annotated

from fastapi import Depends, Request

from app.core.config import get_settings
from app.core.errors import Forbidden, Unauthorized
from app.db.session import DbSession
from app.models import User
from app.services import auth as auth_service


async def get_optional_user(request: Request, db: DbSession) -> User | None:
    token = request.cookies.get(get_settings().session_cookie_name)
    if not token:
        return None
    return await auth_service.user_by_session(db, token)


async def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    if user is None:
        raise Unauthorized("Нужно войти в аккаунт")
    return user


async def get_admin_user(user: Annotated[User, Depends(get_current_user)]) -> User:
    if not user.is_admin:
        raise Forbidden("Доступно только администраторам")
    return user


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_admin_user)]


def client_ip(request: Request) -> str:
    # За Caddy реальный IP приходит в X-Forwarded-For.
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
