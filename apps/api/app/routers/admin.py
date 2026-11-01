"""Админка: модерация, метрики воронки, журнал действий. Все действия пишутся в admin_actions."""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated, Literal

from fastapi import APIRouter, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy import delete, func, or_, select

from app.core.demo import is_demo, real_user
from app.core.deps import AdminUser
from app.core.errors import Forbidden, NotFound
from app.db.session import DbSession
from app.models import (
    AdminAction,
    Application,
    Event,
    Feedback,
    Profile,
    Report,
    Role,
    Session,
    Skill,
    Startup,
    User,
)
from app.models.enums import ApplicationStatus, ReportStatus, StartupStatus
from app.schemas.common import OkOut
from app.schemas.ops import (
    ActivityOut,
    AdminActionOut,
    AdminOverview,
    AdminStartupOut,
    AdminTotals,
    AdminUserOut,
    CatalogItemIn,
    CatalogMergeIn,
    CatalogRenameIn,
    CohortRow,
    FeedbackOut,
    FunnelStep,
    HypothesisRow,
    MetricsOut,
    PlatformStartupIn,
    ReportOut,
    SourceRow,
)
from app.schemas.startup import StartupDetail, StartupIn
from app.services import admin_overview, catalog_admin, retention
from app.services import auth as auth_service
from app.services import feedback as feedback_service
from app.services import hypotheses as hypotheses_service
from app.services import jobs as jobs_service
from app.services import startups as startup_service

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
    queue = await jobs_service.stats(db)
    return MetricsOut(
        days=days,
        jobs_pending=queue["pending"],
        jobs_failed=queue["failed"],
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


@router.get("/totals", response_model=AdminTotals)
async def admin_totals(
    admin: AdminUser, db: DbSession, days: Annotated[int, Query(ge=1, le=365)] = 7
) -> AdminTotals:
    return await admin_overview.totals(db, days)


@router.get("/overview", response_model=AdminOverview)
async def admin_overview_page(
    admin: AdminUser, db: DbSession, days: Annotated[int, Query(ge=7, le=90)] = 14
) -> AdminOverview:
    """Первый экран админки: цифры, регистрации по дням и последние пользователи."""
    return await admin_overview.overview(db, days)


@router.get("/activity", response_model=list[ActivityOut])
async def admin_activity(
    admin: AdminUser, db: DbSession, limit: Annotated[int, Query(ge=1, le=200)] = 50
) -> list[ActivityOut]:
    """Лента ключевых событий: регистрации, подтверждения почты, публикации, отклики."""
    return await admin_overview.activity(db, limit)


@router.get("/feedback/{feedback_id}/screenshot", response_class=FileResponse)
async def admin_feedback_screenshot(feedback_id: int, admin: AdminUser, db: DbSession):
    fb = await db.get(Feedback, feedback_id)
    path = feedback_service.screenshot_path(fb) if fb else None
    if path is None or not path.exists():
        raise NotFound("Скриншота нет")
    return FileResponse(
        path, media_type="image/webp", headers={"Cache-Control": "private, no-store"}
    )


@router.delete("/feedback/{feedback_id}", response_model=OkOut)
async def admin_delete_feedback(feedback_id: int, admin: AdminUser, db: DbSession) -> OkOut:
    """Убрать сообщение (спам, тест) вместе со скриншотом."""
    fb = await db.get(Feedback, feedback_id)
    if fb is None:
        raise NotFound("Сообщение не найдено")
    path = feedback_service.screenshot_path(fb)
    await db.delete(fb)
    _log(db, admin, "delete_feedback", "feedback", feedback_id)
    await db.commit()
    if path:
        path.unlink(missing_ok=True)
    return OkOut()


@router.get("/feedback", response_model=list[FeedbackOut])
async def admin_feedback(admin: AdminUser, db: DbSession) -> list[FeedbackOut]:
    """Сообщения из формы «Сообщить о проблеме или идее» в подвале, новые сверху."""
    return await admin_overview.feedback(db)


@router.get("/users", response_model=list[AdminUserOut])
async def admin_list_users(
    admin: AdminUser,
    db: DbSession,
    q: str | None = None,
    kind: Annotated[Literal["all", "real", "demo", "admins"], Query()] = "all",
    days: Annotated[int | None, Query(ge=1, le=365)] = None,
) -> list[AdminUserOut]:
    """kind: real — настоящие (без демо и E2E), demo — примеры с витрины, admins — админы."""
    stmt = (
        select(User)
        .outerjoin(Profile, Profile.user_id == User.id)
        .order_by(User.created_at.desc())
        .limit(300)
    )
    if q:
        stmt = stmt.where(or_(User.email.ilike(f"%{q}%"), Profile.display_name.ilike(f"%{q}%")))
    if kind == "real":
        stmt = stmt.where(admin_overview.real())
    elif kind == "demo":
        stmt = stmt.where(~real_user())
    elif kind == "admins":
        stmt = stmt.where(User.is_admin.is_(True))
    if days:
        stmt = stmt.where(User.created_at > datetime.now(UTC) - timedelta(days=days))
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
            is_demo=is_demo(u),
            is_published=bool(u.profile and u.profile.is_published),
            role=u.profile.primary_role.name if u.profile and u.profile.primary_role else None,
        )
        for u in users
    ]


@router.delete("/users/{user_id}", response_model=OkOut)
async def admin_delete_user(user_id: uuid.UUID, admin: AdminUser, db: DbSession) -> OkOut:
    """Удалить аккаунт насовсем: профиль, стартапы, отклики и файлы. Админа удалить нельзя."""
    user = await db.get(User, user_id)
    if user is None:
        raise NotFound("Пользователь не найден")
    if user.is_admin:
        raise Forbidden("Админа удалить нельзя: сначала снимите права")
    _log(db, admin, "delete_user", "user", user.id, email=user.email)
    await db.commit()
    await auth_service.delete_account(db, user)
    return OkOut()


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
async def admin_list_startups(
    admin: AdminUser,
    db: DbSession,
    status: Annotated[
        Literal["all", "recruiting", "draft", "closed", "archived", "hidden"], Query()
    ] = "all",
    days: Annotated[int | None, Query(ge=1, le=365)] = None,
    q: str | None = None,
) -> list[AdminStartupOut]:
    """Новые сверху; фильтры: статус (hidden — скрытые админом), созданы за N дней, поиск."""
    stmt = select(Startup).join(User, User.id == Startup.owner_id)
    if status == "hidden":
        stmt = stmt.where(Startup.is_hidden.is_(True))
    elif status != "all":
        stmt = stmt.where(Startup.status == StartupStatus(status))
    if days:
        stmt = stmt.where(Startup.created_at > datetime.now(UTC) - timedelta(days=days))
    if q:
        stmt = stmt.where(
            or_(
                Startup.title.ilike(f"%{q}%"),
                Startup.slug.ilike(f"%{q}%"),
                User.email.ilike(f"%{q}%"),
            )
        )
    rows = (await db.scalars(stmt.order_by(Startup.created_at.desc()).limit(300))).unique()
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


@router.delete("/startups/{startup_id}", response_model=OkOut)
async def admin_delete_startup(startup_id: uuid.UUID, admin: AdminUser, db: DbSession) -> OkOut:
    """Удалить стартап насовсем: роли и отклики — каскадом, переписка остаётся у людей."""
    s = await db.get(Startup, startup_id)
    if s is None:
        raise NotFound("Стартап не найден")
    _log(db, admin, "delete_startup", "startup", s.id, title=s.title, slug=s.slug)
    await db.commit()
    await startup_service.delete_startup(db, s)
    return OkOut()


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


ACTION_LABELS = {
    "block_user": "Заблокировал пользователя",
    "unblock_user": "Разблокировал пользователя",
    "delete_user": "Удалил пользователя",
    "hide_startup": "Скрыл стартап",
    "unhide_startup": "Вернул стартап в каталог",
    "delete_startup": "Удалил стартап",
    "resolve_report": "Закрыл жалобу",
    "dismiss_report": "Отклонил жалобу",
    "catalog_create": "Добавил в справочник",
    "catalog_rename": "Переименовал в справочнике",
    "catalog_merge": "Слил дубли в справочнике",
    "startup_create_for": "Перенёс стартап на платформу",
    "export_csv": "Выгрузил CSV",
    "delete_feedback": "Удалил сообщение обратной связи",
}


@router.get("/audit", response_model=list[AdminActionOut])
async def admin_audit_log(admin: AdminUser, db: DbSession) -> list[AdminActionOut]:
    """Журнал действий админов: понятная подпись и ссылка на объект, если он ещё существует."""
    rows = (
        await db.execute(
            select(AdminAction, User.email)
            .outerjoin(User, User.id == AdminAction.admin_id)
            .order_by(AdminAction.created_at.desc())
            .limit(200)
        )
    ).all()

    def ids(kind: str) -> list[uuid.UUID]:
        out = []
        for a, _ in rows:
            if a.target_type == kind:
                try:
                    out.append(uuid.UUID(a.target_id))
                except ValueError:
                    pass
        return out

    users = {
        str(u.id): u
        for u in (await db.scalars(select(User).where(User.id.in_(ids("user"))))).unique()
    }
    startups = {
        str(s.id): s
        for s in (await db.scalars(select(Startup).where(Startup.id.in_(ids("startup"))))).unique()
    }

    def target(a: AdminAction) -> tuple[str, str | None]:
        d = a.details or {}
        if a.target_type == "user":
            u = users.get(a.target_id)
            email = u.email if u else d.get("email", "удалённый аккаунт")
            return email, (f"/admin?tab=users&q={email}" if u else None)
        if a.target_type == "startup":
            s = startups.get(a.target_id)
            if s:
                return s.title, f"/startups/{s.slug}"
            return d.get("title", "удалённый стартап"), None
        if a.target_type == "report":
            return (f"жалоба №{a.target_id}" if a.action != "export_csv" else a.target_id), (
                "/admin?tab=moderation" if a.action != "export_csv" else None
            )
        if a.target_type in CATALOGS:
            name = d.get("name") or a.target_id
            into = f" → {d['into']}" if d.get("into") else ""
            kind = "роль" if a.target_type == "roles" else "навык"
            return f"{kind} «{name}»{into}", "/admin?tab=catalog"
        return a.target_id, None

    out = []
    for a, email in rows:
        label, href = target(a)
        out.append(
            AdminActionOut(
                id=a.id,
                admin_email=email,
                action=a.action,
                target_type=a.target_type,
                target_id=a.target_id,
                created_at=a.created_at,
                label=ACTION_LABELS.get(a.action, a.action),
                target_label=label,
                target_href=href,
            )
        )
    return out


# --- Справочники ролей и навыков (KAN-75) ---

CATALOGS = {"roles": Role, "skills": Skill}
CatalogKind = Literal["roles", "skills"]


def _catalog(kind: str):
    if kind not in CATALOGS:
        raise NotFound("Нет такого справочника")
    return CATALOGS[kind]


@router.post("/catalog/{kind}", response_model=OkOut, status_code=201)
async def admin_catalog_create(
    kind: CatalogKind, data: CatalogItemIn, admin: AdminUser, db: DbSession
) -> OkOut:
    item = await catalog_admin.create(db, _catalog(kind), data.name, data.category)
    _log(db, admin, "catalog_create", kind, item.slug, name=item.name)
    await db.commit()
    return OkOut()


@router.patch("/catalog/{kind}/{slug}", response_model=OkOut)
async def admin_catalog_rename(
    kind: CatalogKind,
    slug: str,
    data: CatalogRenameIn,
    admin: AdminUser,
    db: DbSession,
) -> OkOut:
    item = await catalog_admin.rename(db, _catalog(kind), slug, data.name)
    _log(db, admin, "catalog_rename", kind, slug, name=item.name)
    await db.commit()
    return OkOut()


@router.post("/catalog/{kind}/{slug}/merge", response_model=OkOut)
async def admin_catalog_merge(
    kind: CatalogKind,
    slug: str,
    data: CatalogMergeIn,
    admin: AdminUser,
    db: DbSession,
) -> OkOut:
    await catalog_admin.merge(db, _catalog(kind), slug, data.into)
    _log(db, admin, "catalog_merge", kind, slug, into=data.into)
    await db.commit()
    return OkOut()


# --- Перенос стартапа на платформу (KAN-75) ---


@router.post("/startups", response_model=StartupDetail, status_code=201)
async def admin_create_platform_startup(
    data: PlatformStartupIn, admin: AdminUser, db: DbSession
) -> StartupDetail:
    s = await startup_service.create_for_platform(
        db, admin, StartupIn(**data.model_dump(exclude={"owner_email"})), data.owner_email
    )
    _log(
        db,
        admin,
        "startup_create_for",
        "startup",
        s.id,
        owner_email=data.owner_email,
        title=s.title,
    )
    await db.commit()
    return await startup_service.to_detail(db, s, admin)


# --- Удержание и экспорт (KAN-100) ---


@router.get("/cohorts", response_model=list[CohortRow])
async def admin_cohorts(
    admin: AdminUser, db: DbSession, weeks: Annotated[int, Query(ge=1, le=26)] = 8
) -> list[CohortRow]:
    return await retention.cohorts(db, weeks)


@router.get("/export", response_class=Response, responses={200: {"content": {"text/csv": {}}}})
async def admin_export_csv(
    admin: AdminUser,
    db: DbSession,
    kind: Annotated[str, Query(pattern="^(funnel|cohorts)$")] = "funnel",
    days: Annotated[int, Query(ge=1, le=365)] = 30,
) -> Response:
    if kind == "funnel":
        m = await admin_metrics(admin, db, days)
        body = retention.to_csv(
            ["шаг", "событие", f"пользователей за {days} дней"],
            [[f.label, f.name, f.count] for f in m.funnel],
        )
    else:
        rows = await retention.cohorts(db, 8)
        body = retention.to_csv(
            ["неделя регистрации", "регистраций", "D7", "D30"],
            [
                [
                    r.week.isoformat(),
                    r.signups,
                    r.d7 if r.d7 is not None else "",
                    r.d30 if r.d30 is not None else "",
                ]
                for r in rows
            ],
        )
    _log(db, admin, "export_csv", "report", kind, days=days)
    await db.commit()
    filename = f"{kind}-{datetime.now(UTC).date().isoformat()}.csv"
    return Response(
        body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
