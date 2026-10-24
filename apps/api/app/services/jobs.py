"""Очередь фоновых задач в Postgres (KAN-91).

enqueue() кладёт задачу в той же транзакции, что и действие пользователя;
run_once() берёт одну готовую задачу (FOR UPDATE SKIP LOCKED) и выполняет её
с повторами по экспоненте: 1, 2, 4, 8 минут, после пятой неудачи задача помечается failed.
"""

import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Job

logger = logging.getLogger("app.jobs")

MAX_ATTEMPTS = 5
# Задача, взятая воркером, который упал, снова становится доступной через это время.
LEASE = timedelta(minutes=5)

Handler = Callable[[dict], Awaitable[None]]
HANDLERS: dict[str, Handler] = {}


def handler(kind: str) -> Callable[[Handler], Handler]:
    def register(fn: Handler) -> Handler:
        HANDLERS[kind] = fn
        return fn

    return register


def enqueue(db: AsyncSession, kind: str, payload: dict, run_at: datetime | None = None) -> Job:
    """Без commit: задача сохраняется вместе с действием, которое её породило."""
    job = Job(kind=kind, payload=payload)
    if run_at is not None:
        job.run_at = run_at
    db.add(job)
    return job


async def _claim(db: AsyncSession, now: datetime) -> Job | None:
    stmt = (
        select(Job)
        .where(
            Job.done_at.is_(None),
            Job.run_at <= now,
            or_(Job.locked_at.is_(None), Job.locked_at < now - LEASE),
        )
        .order_by(Job.run_at)
        .limit(1)
        .with_for_update(skip_locked=True)
    )
    job = await db.scalar(stmt)
    if job is not None:
        job.locked_at = now
        await db.commit()
    return job


async def run_once(db: AsyncSession) -> bool:
    """Выполнить одну задачу. False — готовых задач нет."""
    now = datetime.now(UTC)
    job = await _claim(db, now)
    if job is None:
        return False
    try:
        fn = HANDLERS.get(job.kind)
        if fn is None:
            raise RuntimeError(f"нет обработчика для {job.kind}")
        await fn(job.payload)
    except Exception as exc:  # noqa: BLE001 — ошибка задачи не должна останавливать воркер
        job.attempts += 1
        job.last_error = f"{type(exc).__name__}: {exc}"[:2000]
        job.locked_at = None
        if job.attempts >= MAX_ATTEMPTS:
            job.done_at, job.failed = datetime.now(UTC), True
            logger.error(f"job {job.id} ({job.kind}) failed permanently: {job.last_error}")
        else:
            job.run_at = datetime.now(UTC) + timedelta(minutes=2 ** (job.attempts - 1))
            logger.warning(
                f"job {job.id} ({job.kind}) failed, retry #{job.attempts}: {job.last_error}"
            )
    else:
        job.done_at = datetime.now(UTC)
    await db.commit()
    return True


async def stats(db: AsyncSession) -> dict[str, int]:
    pending = await db.scalar(select(func.count()).where(Job.done_at.is_(None)))
    failed = await db.scalar(select(func.count()).where(Job.failed.is_(True)))
    return {"pending": pending or 0, "failed": failed or 0}
