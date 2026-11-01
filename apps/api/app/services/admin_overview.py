"""Сводка для админки: простые цифры по настоящим пользователям, регистрации по дням,
последние пользователи и обратная связь из формы «Сообщить о проблеме».

«Настоящие» — без демо-аккаунтов (app.core.demo, @demo.invalid) и E2E (@e2e.example.com).
"""

from datetime import UTC, date, datetime, timedelta

from sqlalchemy import and_, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import Date

from app.core.demo import real_user
from app.models import (
    Application,
    Event,
    Feedback,
    Message,
    Profile,
    Report,
    Session,
    Startup,
    User,
)
from app.models.enums import ApplicationStatus, ReportStatus, StartupStatus
from app.schemas.ops import (
    ActivityOut,
    AdminOverview,
    AdminTotals,
    DayCount,
    FeedbackOut,
    RecentUser,
)

E2E_DOMAIN = "@e2e.example.com"


def real():
    """Условие «настоящий пользователь»: не демо и не E2E."""
    return and_(real_user(), User.email.not_like(f"%{E2E_DOMAIN}"))


async def totals(db: AsyncSession, days: int) -> AdminTotals:
    now = datetime.now(UTC)
    since = now - timedelta(days=days)
    week = now - timedelta(days=7)

    async def count(stmt) -> int:
        return await db.scalar(stmt) or 0

    users = select(func.count()).select_from(User)
    return AdminTotals(
        users=await count(users.where(real(), User.is_active.is_(True))),
        users_new=await count(users.where(real(), User.created_at > since)),
        active_7d=await count(
            select(func.count(func.distinct(Session.user_id)))
            .join(User, User.id == Session.user_id)
            .where(real(), func.coalesce(Session.last_seen_at, Session.created_at) > week)
        ),
        profiles_published=await count(
            select(func.count())
            .select_from(Profile)
            .join(User, User.id == Profile.user_id)
            .where(real(), Profile.is_published.is_(True))
        ),
        startups_recruiting=await count(
            select(func.count())
            .select_from(Startup)
            .join(User, User.id == Startup.owner_id)
            .where(real(), Startup.status == StartupStatus.recruiting)
        ),
        applications_new=await count(
            select(func.count()).select_from(Application).where(Application.created_at > since)
        ),
        applications_pending=await count(
            select(func.count())
            .select_from(Application)
            .where(Application.status == ApplicationStatus.pending)
        ),
        messages_new=await count(
            select(func.count()).select_from(Message).where(Message.created_at > since)
        ),
        reports_open=await count(
            select(func.count()).select_from(Report).where(Report.status == ReportStatus.new)
        ),
        feedback_new=await count(
            select(func.count()).select_from(Feedback).where(Feedback.created_at > since)
        ),
        demo_users=await count(users.where(~real_user())),
    )


async def overview(db: AsyncSession, days: int) -> AdminOverview:
    """Цифры + регистрации по дням за период + пять последних настоящих пользователей."""
    since = datetime.now(UTC) - timedelta(days=days)
    day = cast(User.created_at, Date)
    rows = dict(
        (
            await db.execute(
                select(day, func.count()).where(real(), User.created_at > since).group_by(day)
            )
        ).all()
    )
    today = date.today()
    signups = [
        DayCount(day=d, count=rows.get(d, 0))
        for d in (today - timedelta(days=i) for i in range(days - 1, -1, -1))
    ]
    recent = (
        await db.scalars(select(User).where(real()).order_by(User.created_at.desc()).limit(5))
    ).unique()
    return AdminOverview(
        totals=await totals(db, days),
        signups=signups,
        recent=[
            RecentUser(
                id=str(u.id),
                email=u.email,
                display_name=u.profile.display_name if u.profile else "",
                role=u.profile.primary_role.name if u.profile and u.profile.primary_role else None,
                is_published=bool(u.profile and u.profile.is_published),
                created_at=u.created_at,
            )
            for u in recent
        ],
    )


async def feedback(db: AsyncSession, limit: int = 100) -> list[FeedbackOut]:
    rows = (
        await db.execute(
            select(Feedback, User.email)
            .outerjoin(User, User.id == Feedback.user_id)
            .order_by(Feedback.created_at.desc())
            .limit(limit)
        )
    ).all()
    return [
        FeedbackOut(
            id=f.id,
            text=f.text,
            page_url=f.page_url,
            created_at=f.created_at,
            user_email=email,
            has_screenshot=bool(f.screenshot_key),
        )
        for f, email in rows
    ]


# Ключевые шаги пути пользователя — по ним видно, где люди застревают. Просмотры страниц
# и служебные события (подборки, показы рекомендаций) в ленту не попадают.
ACTIVITY_LABELS = {
    "signup": "Зарегистрировался",
    "email_verified": "Подтвердил почту",
    "profile_completed": "Заполнил профиль",
    "profile_published": "Опубликовал профиль",
    "startup_created": "Создал стартап",
    "startup_published": "Опубликовал стартап",
    "application_sent": "Откликнулся на место",
    "invite_sent": "Пригласил в команду",
    "application_answered": "Ответил на отклик",
    "contacts_exchanged": "Обменялись контактами",
    "chat_started": "Начал переписку",
    "team_assembled": "Собрал команду",
    "startup_claimed": "Забрал перенесённый стартап",
    "email_changed": "Сменил почту",
}


async def activity(db: AsyncSession, limit: int = 50) -> list[ActivityOut]:
    rows = (
        await db.execute(
            select(Event.created_at, Event.name, User.email)
            .outerjoin(User, User.id == Event.user_id)
            .where(Event.name.in_(ACTIVITY_LABELS))
            .order_by(Event.created_at.desc())
            .limit(limit)
        )
    ).all()
    return [
        ActivityOut(created_at=at, name=name, label=ACTIVITY_LABELS[name], user_email=email)
        for at, name, email in rows
    ]
