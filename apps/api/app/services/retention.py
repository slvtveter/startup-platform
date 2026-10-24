"""Удержание по недельным когортам и экспорт в CSV (KAN-100).

Когорта — неделя регистрации (событие signup). Вернувшийся на D7 — совершил осмысленное
действие на 7–13 день после регистрации, на D30 — на 30–36 день.
"""

import csv
import io
import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event
from app.schemas.ops import CohortRow

# Действия, ради которых люди приходят на платформу (а не просто вход на сайт).
ACTIVE_EVENTS = (
    "application_sent",
    "invite_sent",
    "application_answered",
    "startup_published",
    "profile_published",
)


def _week_start(d: datetime) -> date:
    return (d - timedelta(days=d.weekday())).date()


async def cohorts(db: AsyncSession, weeks: int = 8, now: datetime | None = None) -> list[CohortRow]:
    now = now or datetime.now(UTC)
    first_week = _week_start(now) - timedelta(weeks=weeks - 1)
    signups: dict[uuid.UUID, datetime] = dict(
        (
            await db.execute(
                select(Event.user_id, Event.created_at).where(
                    Event.name == "signup",
                    Event.user_id.is_not(None),
                    Event.created_at >= datetime.combine(first_week, datetime.min.time(), UTC),
                )
            )
        ).all()
    )
    activity: dict[uuid.UUID, list[datetime]] = {}
    if signups:
        rows = await db.execute(
            select(Event.user_id, Event.created_at).where(
                Event.name.in_(ACTIVE_EVENTS), Event.user_id.in_(list(signups))
            )
        )
        for uid, at in rows:
            activity.setdefault(uid, []).append(at)

    def returned(uid: uuid.UUID, start: int, end: int) -> bool:
        base = signups[uid]
        return any(start <= (at - base).days <= end for at in activity.get(uid, []))

    out = []
    for i in range(weeks):
        week = first_week + timedelta(weeks=i)
        users = [u for u, at in signups.items() if _week_start(at) == week]
        # Когорта «дозрела» до D7/D30, только если прошло достаточно дней с конца недели.
        week_end = datetime.combine(week + timedelta(days=6), datetime.max.time(), UTC)
        d7_ready = now >= week_end + timedelta(days=13)
        d30_ready = now >= week_end + timedelta(days=36)
        out.append(
            CohortRow(
                week=week,
                signups=len(users),
                d7=round(sum(returned(u, 7, 13) for u in users) / len(users), 3)
                if users and d7_ready
                else None,
                d30=round(sum(returned(u, 30, 36) for u in users) / len(users), 3)
                if users and d30_ready
                else None,
            )
        )
    return out


def to_csv(header: list[str], rows: list[list[object]]) -> str:
    """CSV для Excel и Google Sheets: UTF-8 с BOM, разделитель — запятая."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(header)
    writer.writerows(rows)
    return "﻿" + buf.getvalue()
