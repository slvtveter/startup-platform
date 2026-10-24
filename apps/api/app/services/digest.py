"""Еженедельная подборка новых ролей под профиль (KAN-107).

Шаг CJM «ожидание»: новичок зарегистрировался, но не знает, что появились подходящие места.
Совпадение — как в подборе v0: основная роль или общие навыки. Пустую подборку не шлём.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, Profile, Startup, StartupRole, User
from app.models.enums import StartupStatus
from app.services import mail, notifications
from app.services.events import track

WINDOW = timedelta(days=7)
MAX_ROLES = 5


def _week(now: datetime) -> str:
    year, week, _ = now.isocalendar()
    return f"{year}-W{week:02d}"


async def send_weekly(db: AsyncSession, now: datetime | None = None) -> int:
    """Разослать подборку за последние 7 дней. Повторный запуск в ту же неделю ничего не шлёт."""
    now = now or datetime.now(UTC)
    week = _week(now)
    roles = list(
        (
            await db.scalars(
                select(StartupRole)
                .join(Startup, Startup.id == StartupRole.startup_id)
                .where(
                    StartupRole.is_open.is_(True),
                    StartupRole.created_at > now - WINDOW,
                    Startup.status == StartupStatus.recruiting,
                    Startup.is_hidden.is_(False),
                )
                .order_by(StartupRole.created_at.desc())
            )
        ).unique()
    )
    if not roles:
        return 0
    already = set(
        await db.scalars(
            select(Event.user_id).where(
                Event.name == "digest_sent", Event.props["week"].astext == week
            )
        )
    )
    users = (
        await db.scalars(
            select(User)
            .join(Profile, Profile.user_id == User.id)
            .where(
                Profile.is_published.is_(True),
                User.is_active.is_(True),
                User.email_verified_at.is_not(None),
            )
        )
    ).unique()
    sent = 0
    for user in users:
        if user.id in already or not notifications.enabled(user, "digest"):
            continue
        p = user.profile
        my_skills = {s.id for s in p.skills}
        picked = [
            r
            for r in roles
            if r.startup.owner_id != user.id
            and (r.role_id == p.primary_role_id or my_skills & {s.id for s in r.skills})
        ][:MAX_ROLES]
        if not picked:
            continue
        lines = [
            f"• {r.title} в «{r.startup.title}»: {r.startup.pitch}\n"
            f"  {mail.link(f'/startups/{r.startup.slug}?src=digest')}"
            for r in picked
        ]
        await mail.send_mail(
            user.email,
            f"Новые места в командах: {len(picked)} под ваш профиль",
            "За неделю открылись роли, которые подходят вашему профилю.\n\n"
            + "\n\n".join(lines)
            + f"\n\nВсе стартапы: {mail.link('/startups?src=digest')}",
            user=user,
            kind="digest",
        )
        track(db, "digest_sent", user.id, roles=str(len(picked)), week=week)
        sent += 1
    await db.commit()
    return sent
