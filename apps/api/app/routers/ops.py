from datetime import UTC, datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select

from app.core.deps import OptionalUser
from app.db.session import DbSession
from app.models import Event, Feedback, Profile, Report, Startup
from app.models.enums import StartupStatus
from app.schemas.common import OkOut
from app.schemas.ops import FeedbackIn, ReportIn, StatsOut

router = APIRouter(tags=["ops"])


@router.get("/stats", response_model=StatsOut)
async def public_stats(db: DbSession) -> StatsOut:
    since = datetime.now(UTC) - timedelta(days=30)
    startups = await db.scalar(
        select(func.count()).where(
            Startup.status == StartupStatus.recruiting, Startup.is_hidden.is_(False)
        )
    )
    people = await db.scalar(select(func.count()).where(Profile.is_published.is_(True)))
    intros = await db.scalar(
        select(func.count()).where(Event.name == "contacts_exchanged", Event.created_at > since)
    )
    return StatsOut(startups=startups or 0, people=people or 0, intros_30d=intros or 0)


@router.post("/reports", response_model=OkOut, status_code=201)
async def create_report(data: ReportIn, user: OptionalUser, db: DbSession) -> OkOut:
    db.add(
        Report(
            reporter_id=user.id if user else None,
            target_type=data.target_type,
            target_id=data.target_id,
            reason=data.reason,
            comment=data.comment,
        )
    )
    await db.commit()
    return OkOut()


@router.post("/feedback", response_model=OkOut, status_code=201)
async def send_feedback(data: FeedbackIn, user: OptionalUser, db: DbSession) -> OkOut:
    db.add(Feedback(user_id=user.id if user else None, text=data.text, page_url=data.page_url))
    await db.commit()
    return OkOut()
