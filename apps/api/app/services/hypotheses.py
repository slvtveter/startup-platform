"""Панель гипотез редизайна H1–H8 (docs/ux/research.md, KAN-92).

Каждая гипотеза — одна метрика за период и за такой же предыдущий период.
Если данных нет, значение None: в интерфейсе это «нет данных», а не ноль.
"""

from datetime import UTC, datetime, timedelta
from statistics import median

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Application, Event, Report
from app.models.enums import ApplicationStatus, ReportReason
from app.schemas.ops import HypothesisRow

Window = tuple[datetime, datetime]


async def _count(db: AsyncSession, name: str, w: Window) -> int:
    return (
        await db.scalar(
            select(func.count()).where(Event.name == name, Event.created_at.between(*w))
        )
        or 0
    )


async def _ratio(db: AsyncSession, num: str, den: str, w: Window) -> float | None:
    d = await _count(db, den, w)
    return round(await _count(db, num, w) / d, 3) if d else None


async def _answered_72h(db: AsyncSession, w: Window) -> float | None:
    rows = (
        await db.execute(
            select(Application.created_at, Application.decided_at).where(
                Application.created_at.between(*w),
                Application.status != ApplicationStatus.withdrawn,
            )
        )
    ).all()
    if not rows:
        return None
    fast = sum(1 for c, d in rows if d and d - c <= timedelta(hours=72))
    return round(fast / len(rows), 3)


async def _median_gap_hours(db: AsyncSession, first: str, then: str, w: Window) -> float | None:
    """Медиана часов от события first до первого события then у того же объекта/пользователя."""
    key = Event.user_id if first == "signup" else Event.entity_id
    starts = dict(
        (
            await db.execute(
                select(key, func.min(Event.created_at))
                .where(Event.name == first, Event.created_at.between(*w))
                .group_by(key)
            )
        ).all()
    )
    if not starts:
        return None
    ends = dict(
        (
            await db.execute(
                select(key, func.min(Event.created_at))
                .where(Event.name == then, key.in_(list(starts)))
                .group_by(key)
            )
        ).all()
    )
    gaps = [(ends[k] - t).total_seconds() / 3600 for k, t in starts.items() if k in ends]
    return round(median(gaps), 1) if gaps else None


async def _spam_per_100(db: AsyncSession, w: Window) -> float | None:
    sent = await _count(db, "application_sent", w)
    if not sent:
        return None
    spam = await db.scalar(
        select(func.count()).where(
            Report.reason == ReportReason.spam, Report.created_at.between(*w)
        )
    )
    return round((spam or 0) * 100 / sent, 2)


# (ключ, гипотеза, метрика, единица, функция расчёта)
HYPOTHESES = [
    ("H1", "Живые свободные места на первом экране", "Регистрации / просмотры лендинга", "%",
     lambda db, w: _ratio(db, "signup", "landing_viewed", w)),
    ("H2", "Развилка «Ищу опыт / Собираю команду»", "Клики по развилке / просмотры лендинга", "%",
     lambda db, w: _ratio(db, "landing_path_selected", "landing_viewed", w)),
    ("H3", "У роли видны часы и «что получишь»", "Отклики / просмотры стартапов", "%",
     lambda db, w: _ratio(db, "application_sent", "startup_viewed", w)),
    ("H4", "Отклик одним полем с подсказкой", "Отправили отклик / открыли диалог", "%",
     lambda db, w: _ratio(db, "application_sent", "apply_started", w)),
    ("H5", "Видна скорость ответа команды", "Доля откликов с ответом за 72 ч", "%",
     _answered_72h),
    ("H6", "Отклик с минимальным профилем", "Медиана часов от регистрации до первого отклика", "ч",
     lambda db, w: _median_gap_hours(db, "signup", "application_sent", w)),
    ("H7", "Команда как места при создании", "Медиана часов от черновика до публикации", "ч",
     lambda db, w: _median_gap_hours(db, "startup_created", "startup_published", w)),
    ("H8", "Контакты после взаимного согласия", "Жалобы на спам на 100 откликов", "шт",
     _spam_per_100),
]  # fmt: skip


async def hypotheses(
    db: AsyncSession, days: int, now: datetime | None = None
) -> list[HypothesisRow]:
    now = now or datetime.now(UTC)
    cur: Window = (now - timedelta(days=days), now)
    prev: Window = (now - timedelta(days=2 * days), cur[0])
    return [
        HypothesisRow(
            key=key,
            title=title,
            metric=metric,
            unit=unit,
            current=await calc(db, cur),
            previous=await calc(db, prev),
        )
        for key, title, metric, unit, calc in HYPOTHESES
    ]
