"""Удаление устаревших служебных записей. Сроки совпадают с политикой конфиденциальности (п. 8.3):
поменял здесь — поправь /privacy (apps/web/src/lib/legal/privacy.ts).
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuthAttempt, EmailToken, Session

SECURITY_LOG_DAYS = 30


async def purge_expired(db: AsyncSession, now: datetime | None = None) -> None:
    now = now or datetime.now(UTC)
    old = now - timedelta(days=SECURITY_LOG_DAYS)
    await db.execute(delete(Session).where(Session.expires_at <= now))
    await db.execute(delete(AuthAttempt).where(AuthAttempt.created_at <= old))
    await db.execute(delete(EmailToken).where(EmailToken.expires_at <= old))
    await db.commit()
