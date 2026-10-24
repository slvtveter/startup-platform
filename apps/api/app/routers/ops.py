from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Request
from sqlalchemy import func, select

from app.core.deps import OptionalUser, client_ip
from app.db.session import DbSession
from app.models import Event, Feedback, Profile, Report, Startup, StartupRole
from app.models.enums import StartupStatus
from app.schemas.common import OkOut
from app.schemas.ops import ClientEventIn, FeedbackIn, ReportIn, StatsOut
from app.services import client_events

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
    open_roles = await db.scalar(
        select(func.count())
        .select_from(StartupRole)
        .join(Startup, Startup.id == StartupRole.startup_id)
        .where(
            StartupRole.is_open.is_(True),
            Startup.status == StartupStatus.recruiting,
            Startup.is_hidden.is_(False),
        )
    )
    intros = await db.scalar(
        select(func.count()).where(Event.name == "contacts_exchanged", Event.created_at > since)
    )
    return StatsOut(
        startups=startups or 0,
        people=people or 0,
        open_roles=open_roles or 0,
        intros_30d=intros or 0,
    )


@router.post("/events", response_model=OkOut, status_code=201)
async def track_client_event(
    data: ClientEventIn, request: Request, user: OptionalUser, db: DbSession
) -> OkOut:
    props = {
        k: v
        for k, v in (("path", data.path), ("slug", data.slug), ("src", data.src))
        if v is not None
    }
    # Отброшенное лимитом событие отвечает так же, как принятое: боту не видно, что его отсекли.
    await client_events.record(
        db, data.name, client_ip(request), user.id if user else None, **props
    )
    return OkOut()


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
