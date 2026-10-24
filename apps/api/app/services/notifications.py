"""Настройки писем и отписка без входа (KAN-74).

Ссылка отписки подписана HMAC от SECRET_KEY: её нельзя подделать для чужого аккаунта,
а повторное нажатие ничего не ломает (отписка идемпотентна).
"""

import hashlib
import hmac
import uuid
from urllib.parse import urlencode

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError
from app.models import User

# Уведомления, от которых можно отписаться. Письма входа и сброса пароля — служебные, их нельзя.
KINDS: dict[str, str] = {
    "applications": "Новые отклики на мои стартапы",
    "decisions": "Решения по моим откликам и приглашениям",
    "invites": "Приглашения в команды",
    "reminders": "Напоминания об откликах без ответа",
    "digest": "Подборка новых ролей под мой профиль, раз в неделю",
}


def enabled(user: User, kind: str) -> bool:
    return (user.email_prefs or {}).get(kind, True) is not False


def prefs(user: User) -> dict[str, bool]:
    return {kind: enabled(user, kind) for kind in KINDS}


def _sign(user_id: str, kind: str) -> str:
    key = get_settings().secret_key.encode()
    return hmac.new(key, f"unsubscribe:{user_id}:{kind}".encode(), hashlib.sha256).hexdigest()[:32]


def unsubscribe_url(user_id: uuid.UUID, kind: str) -> str:
    query = urlencode({"u": str(user_id), "k": kind, "t": _sign(str(user_id), kind)})
    return get_settings().site_url.rstrip("/") + "/unsubscribe?" + query


async def set_prefs(db: AsyncSession, user: User, values: dict[str, bool]) -> None:
    unknown = set(values) - set(KINDS)
    if unknown:
        raise AppError("Неизвестный тип писем", {"kinds": sorted(unknown)})
    user.email_prefs = {**(user.email_prefs or {}), **values}
    await db.commit()


async def unsubscribe(db: AsyncSession, user_id: str, kind: str, token: str) -> str:
    """Отписка по ссылке из письма. Возвращает подпись типа писем для экрана подтверждения."""
    if kind not in KINDS or not hmac.compare_digest(_sign(user_id, kind), token):
        raise AppError("Ссылка отписки недействительна")
    try:
        user = await db.get(User, uuid.UUID(user_id))
    except ValueError:
        user = None
    if user is None:
        raise AppError("Ссылка отписки недействительна")
    await set_prefs(db, user, {kind: False})
    return KINDS[kind]
