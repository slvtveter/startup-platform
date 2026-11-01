from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Form, Request, UploadFile
from sqlalchemy import func, select

from app.core.demo import real_user
from app.core.deps import OptionalUser, client_ip
from app.db.session import DbSession
from app.models import Event, Profile, Report, Startup, StartupRole, User
from app.models.enums import StartupStatus
from app.schemas.common import OkOut
from app.schemas.ops import ClientEventIn, FeedbackIn, ReportIn, StatsOut
from app.services import client_events, ratelimit
from app.services import feedback as feedback_service

router = APIRouter(tags=["ops"])


async def _limit(db: DbSession, kind: str, request: Request) -> None:
    # Жалобы и отзывы можно слать без входа: ограничиваем по IP, чтобы бот не завалил модерацию.
    key = f"{kind}:{client_ip(request)}"
    await ratelimit.ensure_allowed(db, key, 20)
    ratelimit.hit(db, key)


@router.get("/stats", response_model=StatsOut)
async def public_stats(db: DbSession) -> StatsOut:
    since = datetime.now(UTC) - timedelta(days=30)
    startups = await db.scalar(
        select(func.count())
        .select_from(Startup)
        .join(User, User.id == Startup.owner_id)
        .where(
            Startup.status == StartupStatus.recruiting, Startup.is_hidden.is_(False), real_user()
        )
    )
    people = await db.scalar(
        select(func.count())
        .select_from(Profile)
        .join(User, User.id == Profile.user_id)
        .where(Profile.is_published.is_(True), real_user())
    )
    open_roles = await db.scalar(
        select(func.count())
        .select_from(StartupRole)
        .join(Startup, Startup.id == StartupRole.startup_id)
        .join(User, User.id == Startup.owner_id)
        .where(
            StartupRole.is_open.is_(True),
            Startup.status == StartupStatus.recruiting,
            Startup.is_hidden.is_(False),
            real_user(),
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
async def create_report(
    data: ReportIn, request: Request, user: OptionalUser, db: DbSession
) -> OkOut:
    await _limit(db, "report", request)
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
async def send_feedback(
    data: FeedbackIn, request: Request, user: OptionalUser, db: DbSession
) -> OkOut:
    await _limit(db, "feedback", request)
    await feedback_service.create(db, user, data.text, data.page_url, None)
    return OkOut()


@router.post("/feedback/form", response_model=OkOut, status_code=201)
async def send_feedback_form(
    request: Request,
    user: OptionalUser,
    db: DbSession,
    text: Annotated[str, Form(min_length=3, max_length=3000)],
    page_url: Annotated[str, Form(max_length=500)] = "",
    screenshot: UploadFile | None = None,
) -> OkOut:
    """То же, что /feedback, но можно приложить скриншот (до 5 МБ)."""
    await _limit(db, "feedback", request)
    data = await screenshot.read(feedback_service.MAX_BYTES + 1) if screenshot else None
    await feedback_service.create(db, user, text, page_url, data or None)
    return OkOut()
