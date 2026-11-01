"""Сводка для админки: общие цифры и обратная связь из формы «Сообщить о проблеме»."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Application, Feedback, Profile, Report, Startup, User
from app.models.enums import ApplicationStatus, ReportStatus, StartupStatus
from app.schemas.ops import AdminTotals, FeedbackOut


async def totals(db: AsyncSession, days: int) -> AdminTotals:
    since = datetime.now(UTC) - timedelta(days=days)

    async def count(*where) -> int:
        return await db.scalar(select(func.count()).where(*where)) or 0

    return AdminTotals(
        users=await count(User.is_active.is_(True)),
        users_new=await count(User.created_at > since),
        profiles_published=await count(Profile.is_published.is_(True)),
        startups_recruiting=await count(Startup.status == StartupStatus.recruiting),
        applications_pending=await count(Application.status == ApplicationStatus.pending),
        reports_open=await count(Report.status == ReportStatus.new),
        feedback_new=await count(Feedback.created_at > since),
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
            id=f.id, text=f.text, page_url=f.page_url, created_at=f.created_at, user_email=email
        )
        for f, email in rows
    ]
