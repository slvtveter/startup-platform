from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import TooManyRequests
from app.models import AuthAttempt


async def ensure_allowed(db: AsyncSession, key: str, limit: int | None = None) -> None:
    s = get_settings()
    since = datetime.now(UTC) - timedelta(minutes=s.auth_rate_window_minutes)
    count = await db.scalar(
        select(func.count()).where(AuthAttempt.key == key, AuthAttempt.created_at > since)
    )
    if (count or 0) >= (limit or s.auth_rate_limit):
        raise TooManyRequests("Слишком много попыток. Попробуйте через 15 минут.")


def hit(db: AsyncSession, key: str) -> None:
    db.add(AuthAttempt(key=key))


async def reset(db: AsyncSession, key: str) -> None:
    await db.execute(delete(AuthAttempt).where(AuthAttempt.key == key))
