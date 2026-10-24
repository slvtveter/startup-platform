"""Админка: модерация, метрики воронки, журнал действий. Все действия пишутся в admin_actions."""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import delete, func, or_, select

from app.core.deps import AdminUser
from app.core.errors import NotFound
from app.db.session import DbSession
from app.models import AdminAction, Application, Event, Profile, Report, Session, Startup, User
from app.models.enums import ApplicationStatus, ReportStatus, StartupStatus
from app.schemas.common import OkOut
from app.schemas.ops import (
    AdminActionOut,
    AdminStartupOut,
    AdminUserOut,
    FunnelStep,
    HypothesisRow,
    MetricsOut,
    ReportOut,
    SourceRow,
)
from app.services import hypotheses as hypotheses_service

router = APIRouter(prefix="/admin", tags=["admin"])

FUNNEL = [
    ("signup", "Регистрация"),
    ("email_verified", "Подтвердили email"),
    ("profile_completed", "Заполнили профиль"),
    ("application_sent", "Отправили отклик"),
    ("application_answered", "Получили ответ"),
    ("contacts_exchanged", "Знакомство состоялось"),
]


def _log(db, admin: User, action: str, target_type: str, target_id: object, **details) -> None:
    db.add(
        AdminAction(
            admin_id=admin.id,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            details=details,
        )
    )


@router.get("/hypotheses", response_model=list[HypothesisRow])
async def admin_hypotheses(
    admin: AdminUser, db: DbSession, days: Annotated[int, Query(ge=1, le=180)] = 30
) -> list[HypothesisRow]:
    return await hypotheses_service.hypotheses(db, days)


@router.get("/metrics", response_model=MetricsOut)
async def admin_metrics(
    admin: AdminUser, db: DbSession, days: Annotated[int, Query(ge=1, le=365)] = 7
) -> MetricsOut:
    since = datetime.now(UTC) - timedelta(days=days)
    counts = dict(
        (
            await db.execute(
                select(Event.name, func.count(func.distinct(Event.user_id)))
                .where(Event.created_at > since)
                .group_by(Event.name)
            )
        ).all()
    )
    # Знакомства считаем по событиям, а не по уникальным пользователям.
    counts["contacts_exchanged"] = await db.scalar(
        select(func.count()).where(Event.name == "contacts_exchanged", Event.created_at > since)
    )
    decided = (
        await db.execute(
            select(Application.created_at, Application.decided_at).where(
                Application.created_at > since,
                Application.status.in_([ApplicationStatus.accepted, ApplicationStatus.rejected]),
            )
        )
    ).all()
    total_apps = await db.scalar(
        select(func.count()).where(
            Application.created_at > since, Application.status != ApplicationStatus.withdrawn
        )
    )
    fast = sum(1 for c, d in decided if d and (d - c) <= timedelta(hours=72))
    share = round(fast / total_apps, 3) if total_apps else None
    active = await db.scalar(select(func.count()).where(Startup.status == StartupStatus.recruiting))
    src = Event.props["utm_source"].astext
    sources = (
        await db.execute(
            select(src, func.count())
            .where(Event.name == "signup", Event.created_at > since)
            .group_by(src)
        )
    ).all()
    return MetricsOut(
        days=days,
        funnel=[
            FunnelStep(name=n, label=label, count=counts.get(n, 0) or 0) for n, label in FUNNEL
        ],
        active_startups=active or 0,
        answered_72h_share=share,
        sources=[
            SourceRow(source=s or "direct", signups=c)
            for s, c in sorted(sources, key=lambda r: -r[1])
        ],
    )


@router.get("/users", response_model=list[AdminUserOut])
async def admin_list_users(
    admin: AdminUser, db: DbSession, q: str | None = None
) -> list[AdminUserOut]:
    stmt = (
        select(User)
        .outerjoin(Profile, Profile.user_id == User.id)
        .order_by(User.created_at.desc())
        .limit(200)
    )
    if q:
        stmt = stmt.where(or_(User.email.ilike(f"%{q}%"), Profile.display_name.ilike(f"%{q}%")))
    users = (await db.scalars(stmt)).unique()
    return [
        AdminUserOut(
            id=str(u.id),
            email=u.email,
            display_name=u.profile.display_name if u.profile else "",
            is_active=u.is_active,
            is_admin=u.is_admin,
            email_verified=u.email_verified,
            created_at=u.created_at,
        )
        for u in users
    ]


async def _set_user_active(db, admin: User, user_id: uuid.UUID, active: bool) -> None:
    user = await db.get(User, user_id)
    if user is None:
        raise NotFound("Пользователь не найден")
    user.is_active = active
    if not active:
        await db.execute(delete(Session).where(Session.user_id == user.id))
        if user.profile:
            user.profile.is_published = False
        for s in await db.scalars(select(Startup).where(Startup.owner_id == user.id)):
            s.is_hidden = True
    _log(db, admin, "unblock_user" if active else "block_user", "user", user.id)
    await db.commit()


@router.post("/users/{user_id}/block", response_model=OkOut)
async def admin_block_user(user_id: uuid.UUID, admin: AdminUser, db: DbSession) -> OkOut:
    await _set_user_active(db, admin, user_id, False)
    return OkOut()


@router.post("/users/{user_id}/unblock", response_model=OkOut)
async def admin_unblock_user(user_id: uuid.UUID, admin: AdminUser, db: DbSession) -> OkOut:
    await _set_user_active(db, admin, user_id, True)
    return OkOut()


@router.get("/startups", response_model=list[AdminStartupOut])
async def admin_list_startups(admin: AdminUser, db: DbSession) -> list[AdminStartupOut]:
    rows = (
        await db.scalars(select(Startup).order_by(Startup.created_at.desc()).limit(200))
    ).unique()
    return [
        AdminStartupOut(
            id=str(s.id),
            slug=s.slug,
            title=s.title,
            owner_email=s.owner.email,
            status=str(s.status),
            is_hidden=s.is_hidden,
            created_at=s.created_at,
        )
        for s in rows
    ]


async def _set_hidden(db, admin: User, startup_id: uuid.UUID, hidden: bool) -> None:
    s = await db.get(Startup, startup_id)
    if s is None:
        raise NotFound("Стартап не найден")
    s.is_hidden = hidden
    _log(db, admin, "hide_startup" if hidden else "unhide_startup", "startup", s.id)
    await db.commit()


@router.post("/startups/{startup_id}/hide", response_model=OkOut)
async def admin_hide_startup(startup_id: uuid.UUID, admin: AdminUser, db: DbSession) -> OkOut:
    await _set_hidden(db, admin, startup_id, True)
    return OkOut()


@router.post("/startups/{startup_id}/unhide", response_model=OkOut)
async def admin_unhide_startup(startup_id: uuid.UUID, admin: AdminUser, db: DbSession) -> OkOut:
    await _set_hidden(db, admin, startup_id, False)
    return OkOut()


@router.get("/reports", response_model=list[ReportOut])
async def admin_list_reports(
    admin: AdminUser, db: DbSession, status: str = "new"
) -> list[ReportOut]:
    rows = await db.scalars(
        select(Report).where(Report.status == status).order_by(Report.created_at.desc())
    )
    return [ReportOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("/reports/{report_id}/resolve", response_model=OkOut)
async def admin_resolve_report(
    report_id: int, admin: AdminUser, db: DbSession, dismiss: bool = False
) -> OkOut:
    r = await db.get(Report, report_id)
    if r is None:
        raise NotFound("Жалоба не найдена")
    r.status = ReportStatus.dismissed if dismiss else ReportStatus.resolved
    _log(db, admin, "dismiss_report" if dismiss else "resolve_report", "report", r.id)
    await db.commit()
    return OkOut()


@router.get("/audit", response_model=list[AdminActionOut])
async def admin_audit_log(admin: AdminUser, db: DbSession) -> list[AdminActionOut]:
    rows = await db.execute(
        select(AdminAction, User.email)
        .outerjoin(User, User.id == AdminAction.admin_id)
        .order_by(AdminAction.created_at.desc())
        .limit(200)
    )
    return [
        AdminActionOut(
            id=a.id,
            admin_email=email,
            action=a.action,
            target_type=a.target_type,
            target_id=a.target_id,
            created_at=a.created_at,
        )
        for a, email in rows
    ]
