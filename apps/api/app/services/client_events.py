"""Приём клиентских событий (POST /api/events) с защитой метрик от накрутки (KAN-95).

IP не хранится: в событие пишется только хеш посетителя (IP + соль + дата),
которого хватает для лимита и дедупликации, но не для восстановления адреса.
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models import Event
from app.services.events import track

# Просмотры страниц считаем не чаще раза в 30 минут на посетителя и страницу.
DEDUP_EVENTS = {"landing_viewed", "startup_viewed"}
DEDUP_WINDOW = timedelta(minutes=30)

_process_salt = secrets.token_hex(16)


def visitor_hash(ip: str, now: datetime) -> str:
    salt = get_settings().events_salt or _process_salt
    raw = f"{salt}|{ip}|{now.date().isoformat()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


async def record(db: AsyncSession, name: str, ip: str, user_id=None, **props: str) -> bool:
    """Записать событие. False — отброшено лимитом или дедупликацией."""
    now = datetime.now(UTC)
    v = visitor_hash(ip, now)
    recent = await db.scalar(
        select(func.count()).where(
            Event.props["v"].astext == v, Event.created_at > now - timedelta(minutes=1)
        )
    )
    if (recent or 0) >= get_settings().client_events_per_minute:
        return False
    if name in DEDUP_EVENTS:
        dup = select(Event.id).where(
            Event.name == name,
            Event.props["v"].astext == v,
            Event.created_at > now - DEDUP_WINDOW,
        )
        if "slug" in props:
            dup = dup.where(Event.props["slug"].astext == props["slug"])
        if await db.scalar(dup.limit(1)) is not None:
            return False
    track(db, name, user_id, v=v, **props)
    await db.commit()
    return True
