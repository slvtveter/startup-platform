import uuid
from datetime import UTC, datetime, timedelta
from statistics import median

from sqlalchemy import Select, and_, exists, false, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.demo import is_demo
from app.core.errors import AppError, Forbidden, NotFound
from app.db import search
from app.models import (
    Application,
    Event,
    Profile,
    Role,
    Skill,
    Startup,
    StartupMember,
    StartupRole,
    User,
)
from app.models.enums import ApplicationDirection, ApplicationStatus, StartupStatus
from app.models.startup import startup_role_skills
from app.schemas.catalog import RoleOut, SkillOut
from app.schemas.startup import (
    MemberOut,
    MyStartupOut,
    OpenSeat,
    OpenSeatStartup,
    RecommendedStartup,
    ResponseStats,
    RoleBrief,
    RoleIn,
    RoleUpdate,
    StartupCard,
    StartupDetail,
    StartupIn,
    StartupRoleOut,
    StartupUpdate,
)
from app.services import covers
from app.services.events import track
from app.services.slug import unique_slug

MAX_ACTIVE_STARTUPS = 3
ACTIVE = (StartupStatus.draft, StartupStatus.recruiting)


def _display_name(user: User) -> str:
    if user.profile and user.profile.display_name:
        return user.profile.display_name
    return user.email.split("@")[0]


def to_card(s: Startup) -> StartupCard:
    cover, cover_lg = covers.cover_urls(s)
    return StartupCard(
        id=str(s.id),
        slug=s.slug,
        title=s.title,
        pitch=s.pitch,
        stage=s.stage,
        terms=s.terms,
        status=s.status,
        published_at=s.published_at,
        owner_name=_display_name(s.owner),
        open_roles=[_brief(r) for r in s.roles if r.is_open],
        team_size=1 + sum(1 for m in s.members if m.user_id != s.owner_id),
        is_demo=is_demo(s.owner),
        cover_url=cover,
        cover_url_lg=cover_lg,
    )


def _brief(r: StartupRole) -> RoleBrief:
    return RoleBrief(
        id=str(r.id),
        title=r.title,
        role=RoleOut.model_validate(r.role),
        slots=r.slots,
        hours_per_week=r.hours_per_week,
    )


async def _accepted_counts(db: AsyncSession, role_ids: list[uuid.UUID]) -> dict[uuid.UUID, int]:
    if not role_ids:
        return {}
    rows = await db.execute(
        select(Application.startup_role_id, func.count())
        .where(
            Application.startup_role_id.in_(role_ids),
            Application.status == ApplicationStatus.accepted,
        )
        .group_by(Application.startup_role_id)
    )
    return dict(rows.all())


async def to_detail(db: AsyncSession, s: Startup, viewer: User | None) -> StartupDetail:
    filled = await _accepted_counts(db, [r.id for r in s.roles])
    my_roles: list[str] = []
    if viewer is not None:
        rows = await db.scalars(
            select(Application.startup_role_id).where(
                Application.applicant_id == viewer.id,
                Application.startup_role_id.in_([r.id for r in s.roles]),
                Application.status.in_([ApplicationStatus.pending, ApplicationStatus.accepted]),
            )
        )
        my_roles = [str(r) for r in rows]
    team = [
        MemberOut(
            display_name=_display_name(s.owner),
            slug=_pub_slug(s.owner),
            role_title="Основатель",
            avatar_url=_pub_avatar(s.owner),
        )
    ]
    team += [
        MemberOut(
            display_name=_display_name(m.user),
            slug=_pub_slug(m.user),
            role_title=m.role_title,
            avatar_url=_pub_avatar(m.user),
        )
        for m in s.members
        if m.user_id != s.owner_id
    ]
    return StartupDetail(
        **to_card(s).model_dump(),
        description=s.description,
        terms_details=s.terms_details,
        website=s.website,
        telegram=s.telegram,
        roles=[
            StartupRoleOut(
                id=str(r.id),
                title=r.title,
                role=RoleOut.model_validate(r.role),
                description=r.description,
                slots=r.slots,
                hours_per_week=r.hours_per_week,
                outcome=r.outcome,
                is_open=r.is_open,
                skills=[SkillOut.model_validate(sk) for sk in r.skills],
                filled=filled.get(r.id, 0),
            )
            for r in s.roles
        ],
        team=team,
        is_owner=viewer is not None and viewer.id == s.owner_id,
        my_active_role_ids=my_roles,
        response_stats=await response_stats(db, s),
    )


async def response_stats(db: AsyncSession, s: Startup) -> ResponseStats | None:
    """Доля отвеченных откликов и медиана часов до ответа за 90 дней (гипотеза H5)."""
    since = datetime.now(UTC) - timedelta(days=90)
    rows = (
        await db.execute(
            select(Application.created_at, Application.decided_at)
            .join(StartupRole, StartupRole.id == Application.startup_role_id)
            .where(
                StartupRole.startup_id == s.id,
                Application.direction == ApplicationDirection.apply,
                Application.status != ApplicationStatus.withdrawn,
                Application.created_at > since,
            )
        )
    ).all()
    if len(rows) < 3:
        return None
    hours = sorted(
        (decided - created).total_seconds() / 3600 for created, decided in rows if decided
    )
    return ResponseStats(
        answered_share=round(len(hours) / len(rows), 2),
        median_hours=round(median(hours), 1) if hours else None,
    )


async def open_seats(db: AsyncSession, limit: int) -> list[OpenSeat]:
    """Свежие свободные места во всех открытых стартапах, не больше двух на стартап."""
    rows = await db.scalars(
        select(StartupRole)
        .join(Startup, Startup.id == StartupRole.startup_id)
        .where(
            StartupRole.is_open.is_(True),
            Startup.status == StartupStatus.recruiting,
            Startup.is_hidden.is_(False),
        )
        .order_by(Startup.published_at.desc(), StartupRole.created_at)
        .limit(limit * 3)
    )
    seats: list[OpenSeat] = []
    per_startup: dict[uuid.UUID, int] = {}
    for r in rows.unique():
        if per_startup.get(r.startup_id, 0) >= 2:
            continue
        per_startup[r.startup_id] = per_startup.get(r.startup_id, 0) + 1
        st = r.startup
        seats.append(
            OpenSeat(
                **_brief(r).model_dump(),
                startup=OpenSeatStartup(
                    slug=st.slug,
                    title=st.title,
                    terms=st.terms,
                    stage=st.stage,
                    is_demo=is_demo(st.owner),
                ),
            )
        )
        if len(seats) == limit:
            break
    return seats


def _pub_slug(user: User) -> str | None:
    p = user.profile
    return p.slug if p and p.is_published else None


def _pub_avatar(user: User) -> str | None:
    # Фото показываем по тем же правилам, что и ссылку на профиль: только опубликованным.
    p = user.profile
    return p.avatar_url if p and p.is_published else None


async def get_by_slug(db: AsyncSession, slug: str, viewer: User | None) -> Startup:
    s = await db.scalar(select(Startup).where(Startup.slug == slug))
    is_owner = viewer is not None and s is not None and s.owner_id == viewer.id
    is_admin = viewer is not None and viewer.is_admin
    if s is None or (
        (s.status == StartupStatus.draft or s.is_hidden) and not (is_owner or is_admin)
    ):
        raise NotFound("Стартап не найден")
    return s


async def reload(db: AsyncSession, startup_id: uuid.UUID) -> Startup:
    """Перечитать стартап со всеми связями: при загрузке через роль коллекции не подгружены."""
    stmt = select(Startup).where(Startup.id == startup_id)
    return (await db.scalars(stmt.execution_options(populate_existing=True))).one()


async def get_owned(db: AsyncSession, startup_id: uuid.UUID, user: User) -> Startup:
    s = await db.get(Startup, startup_id)
    if s is None:
        raise NotFound("Стартап не найден")
    if s.owner_id != user.id and not user.is_admin:
        raise Forbidden("Это не ваш стартап")
    return s


async def create_for_platform(
    db: AsyncSession, admin: User, data: StartupIn, owner_email: str
) -> Startup:
    """Админ переносит чужой проект на платформу (KAN-75) без лимита активных стартапов.

    Если человек с этим email уже подтвердил почту, он сразу становится владельцем;
    иначе права перейдут к нему при подтверждении почты (claim_pending).
    """
    email = owner_email.strip().lower()
    owner = await db.scalar(select(User).where(func.lower(User.email) == email))
    ready = owner is not None and owner.is_active and owner.email_verified
    s = Startup(
        owner_id=owner.id if ready else admin.id,
        pending_owner_email=None if ready else email,
        slug=await unique_slug(db, Startup, data.title),
        **data.model_dump(),
    )
    db.add(s)
    track(db, "startup_created", admin.id, "startup", s.id, by_admin=True)
    await db.commit()
    return await reload(db, s.id)


async def claim_pending(db: AsyncSession, user: User) -> int:
    """Передаёт пользователю стартапы, перенесённые на платформу на его email. Без commit."""
    rows = await db.scalars(
        select(Startup).where(func.lower(Startup.pending_owner_email) == user.email.lower())
    )
    claimed = 0
    for s in rows:
        s.owner_id = user.id
        s.pending_owner_email = None
        track(db, "startup_claimed", user.id, "startup", s.id)
        claimed += 1
    return claimed


async def create(db: AsyncSession, user: User, data: StartupIn) -> Startup:
    active = await db.scalar(
        select(func.count()).where(Startup.owner_id == user.id, Startup.status.in_(ACTIVE))
    )
    if (active or 0) >= MAX_ACTIVE_STARTUPS:
        raise AppError(f"Можно вести не больше {MAX_ACTIVE_STARTUPS} активных стартапов")
    s = Startup(
        owner_id=user.id, slug=await unique_slug(db, Startup, data.title), **data.model_dump()
    )
    db.add(s)
    track(db, "startup_created", user.id, "startup", s.id)
    await db.commit()
    return await db.scalar(
        select(Startup).where(Startup.id == s.id).execution_options(populate_existing=True)
    )


async def update(db: AsyncSession, s: Startup, data: StartupUpdate) -> None:
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(s, key, value)
    await db.commit()


def publish_blockers(owner: User, s: Startup) -> list[str]:
    blockers = []
    if not owner.email_verified:
        blockers.append("Подтвердите email")
    if len(s.pitch) < 10:
        blockers.append("Опишите идею одной фразой (от 10 символов)")
    if len(s.description) < 50:
        blockers.append("Добавьте подробное описание (от 50 символов)")
    if not any(r.is_open for r in s.roles):
        blockers.append("Откройте хотя бы одну роль")
    return blockers


async def publish(db: AsyncSession, user: User, s: Startup) -> None:
    blockers = publish_blockers(s.owner, s)
    if blockers:
        raise AppError("Стартап пока нельзя опубликовать", blockers)
    if s.status != StartupStatus.recruiting:
        s.status = StartupStatus.recruiting
        s.published_at = s.published_at or datetime.now(UTC)
        track(db, "startup_published", user.id, "startup", s.id)
    await db.commit()


async def set_status(db: AsyncSession, s: Startup, status: StartupStatus) -> None:
    s.status = status
    await db.commit()


async def _skills(db: AsyncSession, slugs: list[str]) -> list[Skill]:
    skills = list(await db.scalars(select(Skill).where(Skill.slug.in_(slugs))))
    if len(skills) != len(set(slugs)):
        raise AppError("Неизвестный навык", {"field": "skills"})
    return skills


async def add_role(db: AsyncSession, s: Startup, data: RoleIn) -> StartupRole:
    role = await db.scalar(select(Role).where(Role.slug == data.role))
    if role is None:
        raise AppError("Неизвестная роль", {"field": "role"})
    r = StartupRole(
        startup=s,
        role=role,
        title=data.title,
        description=data.description,
        slots=data.slots,
        hours_per_week=data.hours_per_week,
        outcome=data.outcome,
        skills=await _skills(db, data.skills),
    )
    db.add(r)
    _reopen(s)
    await db.commit()
    return r


def _reopen(s: Startup) -> None:
    """Новое открытое место возвращает собранную команду в набор (KAN-99)."""
    if s.status == StartupStatus.closed:
        s.status = StartupStatus.recruiting


async def get_owned_role(db: AsyncSession, role_id: uuid.UUID, user: User) -> StartupRole:
    r = await db.get(StartupRole, role_id)
    if r is None:
        raise NotFound("Роль не найдена")
    if r.startup.owner_id != user.id and not user.is_admin:
        raise Forbidden("Это не ваш стартап")
    return r


async def update_role(db: AsyncSession, r: StartupRole, data: RoleUpdate) -> None:
    values = data.model_dump(exclude_unset=True, exclude={"skills"})
    for key, value in values.items():
        if value is not None:
            setattr(r, key, value)
    if data.skills is not None:
        r.skills = await _skills(db, data.skills)
    if data.is_open:
        _reopen(r.startup)
    await db.commit()


async def delete_role(db: AsyncSession, r: StartupRole) -> None:
    has_apps = await db.scalar(select(exists().where(Application.startup_role_id == r.id)))
    if has_apps:
        raise AppError("На роль уже есть отклики: её можно только закрыть")
    await db.delete(r)
    await db.commit()


def _public_query() -> Select:
    return select(Startup).where(
        Startup.status == StartupStatus.recruiting, Startup.is_hidden.is_(False)
    )


async def list_public(
    db: AsyncSession,
    roles: list[str],
    skills: list[str],
    terms: list[str],
    stages: list[str],
    q: str | None,
    sort: str,
    limit: int,
    offset: int,
) -> tuple[list[Startup], int]:
    stmt = _public_query()
    if roles:
        stmt = stmt.where(
            exists()
            .where(StartupRole.startup_id == Startup.id, StartupRole.is_open.is_(True))
            .where(StartupRole.role_id == Role.id, Role.slug.in_(roles))
        )
    if skills:
        stmt = stmt.where(
            exists()
            .where(StartupRole.startup_id == Startup.id, StartupRole.is_open.is_(True))
            .where(startup_role_skills.c.startup_role_id == StartupRole.id)
            .where(startup_role_skills.c.skill_id == Skill.id, Skill.slug.in_(skills))
        )
    if terms:
        stmt = stmt.where(Startup.terms.in_(terms))
    if stages:
        stmt = stmt.where(Startup.stage.in_(stages))
    q = (q or "").strip()
    rank = None
    if q and not search.has_text(q):
        stmt = stmt.where(false())
    elif q:
        # Стартап находится по своему тексту, по открытой роли (название, тип роли) и навыкам роли.
        pattern = search.like(q)
        open_role = exists().where(
            StartupRole.startup_id == Startup.id, StartupRole.is_open.is_(True)
        )
        hits = [
            search.word_start(Startup.title, q),
            open_role.where(
                or_(
                    StartupRole.title.ilike(pattern),
                    and_(Role.id == StartupRole.role_id, Role.name.ilike(pattern)),
                )
            ),
            open_role.where(startup_role_skills.c.startup_role_id == StartupRole.id).where(
                startup_role_skills.c.skill_id == Skill.id, Skill.name.ilike(pattern)
            ),
        ]
        if len(q) >= search.MIN_FTS_LEN:
            tsq = search.query(q)
            hits += [
                Startup.search.op("@@")(tsq),
                open_role.where(StartupRole.search.op("@@")(tsq)),
            ]
            rank = func.ts_rank(Startup.search, tsq)
        stmt = stmt.where(or_(*hits))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    if rank is not None:
        # Совпадение в названии (вес A) выше, чем в описании; только по роли — в конце.
        stmt = stmt.order_by(rank.desc(), Startup.published_at.desc())
    elif sort == "roles":
        open_roles = (
            select(func.count())
            .where(StartupRole.startup_id == Startup.id, StartupRole.is_open.is_(True))
            .scalar_subquery()
        )
        stmt = stmt.order_by(open_roles.desc(), Startup.published_at.desc())
    else:
        stmt = stmt.order_by(Startup.published_at.desc())
    rows = await db.scalars(stmt.limit(limit).offset(offset))
    return list(rows.unique()), total or 0


async def my_startups(db: AsyncSession, user: User) -> list[MyStartupOut]:
    rows = list(
        (
            await db.scalars(
                select(Startup)
                .where(Startup.owner_id == user.id)
                .order_by(Startup.created_at.desc())
            )
        ).unique()
    )
    # Просмотры страницы за 30 дней (клиентское событие startup_viewed, уже без дублей).
    since = datetime.now(UTC) - timedelta(days=30)
    slug = Event.props["slug"].astext
    views = dict(
        (
            await db.execute(
                select(slug, func.count())
                .where(
                    Event.name == "startup_viewed",
                    Event.created_at > since,
                    slug.in_([s.slug for s in rows]),
                )
                .group_by(slug)
            )
        ).all()
    )
    out = []
    for s in rows:
        pending = await db.scalar(
            select(func.count())
            .select_from(Application)
            .join(StartupRole, StartupRole.id == Application.startup_role_id)
            .where(StartupRole.startup_id == s.id, Application.status == ApplicationStatus.pending)
        )
        out.append(
            MyStartupOut(
                **to_card(s).model_dump(),
                pending_applications=pending or 0,
                is_hidden=s.is_hidden,
                views_30d=views.get(s.slug, 0),
            )
        )
    return out


async def recommended(db: AsyncSession, user: User, limit: int = 6) -> list[RecommendedStartup]:
    """Подбор v0: простая эвристика. Позже её заменит ML-модуль подбора."""
    p: Profile | None = user.profile
    if p is None:
        return []
    my_skills = {s.id for s in p.skills}
    rows = list(
        (
            await db.scalars(_public_query().order_by(Startup.published_at.desc()).limit(200))
        ).unique()
    )
    scored = []
    for s in rows:
        if s.owner_id == user.id:
            continue
        best, reasons = 0, []
        for r in s.roles:
            if not r.is_open:
                continue
            score, why = 0, []
            if p.primary_role_id and r.role_id == p.primary_role_id:
                score += 5
                why.append(f"Ищут: {r.title}")
            common = my_skills & {sk.id for sk in r.skills}
            if common:
                score += 2 * len(common)
                why.append(f"Совпадает навыков: {len(common)}")
            if score > best:
                best, reasons = score, why
        if best and p.looking_for and s.terms in p.looking_for:
            best += 2
            reasons.append("Подходят условия")
        if best:
            scored.append((best, s, reasons))
    scored.sort(key=lambda t: (-t[0], -(t[1].published_at.timestamp() if t[1].published_at else 0)))
    for _, s, _ in scored[:limit]:
        track(db, "recommendation_shown", user.id, "startup", s.id)
    await db.commit()
    return [
        RecommendedStartup(startup=to_card(s), score=sc, reasons=rs) for sc, s, rs in scored[:limit]
    ]


async def add_member(
    db: AsyncSession, startup_id: uuid.UUID, user_id: uuid.UUID, role_title: str
) -> None:
    exists_ = await db.scalar(
        select(StartupMember.id).where(
            StartupMember.startup_id == startup_id, StartupMember.user_id == user_id
        )
    )
    if not exists_:
        db.add(StartupMember(startup_id=startup_id, user_id=user_id, role_title=role_title))
