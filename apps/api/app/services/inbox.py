"""Счётчик новых событий в шапке (KAN-101): без писем человек тоже узнаёт о решениях.

«Мои заявки»: решения по моим откликам и новые приглашения после seen_mine_at.
«Мои стартапы»: новые отклики на мои стартапы после seen_incoming_at.
"""

from datetime import UTC, datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Application, Startup, StartupRole, User
from app.models.enums import ApplicationDirection, ApplicationStatus
from app.schemas.notifications import InboxCountOut

EPOCH = datetime(2000, 1, 1, tzinfo=UTC)


async def counts(db: AsyncSession, user: User) -> InboxCountOut:
    mine_since = user.seen_mine_at or EPOCH
    incoming_since = user.seen_incoming_at or EPOCH
    mine = await db.scalar(
        select(func.count()).where(
            Application.applicant_id == user.id,
            or_(
                # Решение по моему отклику.
                and_(
                    Application.direction == ApplicationDirection.apply,
                    Application.decided_at > mine_since,
                    Application.status.in_(
                        [ApplicationStatus.accepted, ApplicationStatus.rejected]
                    ),
                ),
                # Новое приглашение, на которое ещё нужно ответить.
                and_(
                    Application.direction == ApplicationDirection.invite,
                    Application.status == ApplicationStatus.pending,
                    Application.created_at > mine_since,
                ),
            ),
        )
    )
    incoming = await db.scalar(
        select(func.count())
        .select_from(Application)
        .join(StartupRole, StartupRole.id == Application.startup_role_id)
        .join(Startup, Startup.id == StartupRole.startup_id)
        .where(
            Startup.owner_id == user.id,
            Application.direction == ApplicationDirection.apply,
            Application.status == ApplicationStatus.pending,
            Application.created_at > incoming_since,
        )
    )
    return InboxCountOut(mine=mine or 0, incoming=incoming or 0)


async def mark_seen(db: AsyncSession, user: User, section: str) -> None:
    now = datetime.now(UTC)
    if section == "mine":
        user.seen_mine_at = now
    else:
        user.seen_incoming_at = now
    await db.commit()
