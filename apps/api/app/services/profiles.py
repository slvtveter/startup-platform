from sqlalchemy import Select, and_, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.demo import is_demo
from app.core.errors import AppError, NotFound
from app.db import search
from app.models import (
    Application,
    Profile,
    ProfileLink,
    Role,
    Skill,
    Startup,
    StartupMember,
    StartupRole,
    User,
)
from app.models.enums import StartupStatus
from app.models.profile import profile_skills
from app.schemas.catalog import RoleOut, SkillOut
from app.schemas.profile import (
    LinkOut,
    MembershipOut,
    MyProfileOut,
    PersonCard,
    PersonDetail,
    ProfileUpdate,
)
from app.services.events import track
from app.services.slug import unique_slug

# Вес каждого поля в «заполненности» профиля (сумма 100).
_WEIGHTS = {
    "display_name": (15, "Имя или псевдоним"),
    "primary_role": (15, "Основная роль"),
    "headline": (10, "Короткое описание"),
    "bio": (10, "Рассказ о себе"),
    "skills": (20, "Хотя бы 3 навыка"),
    "links": (15, "Ссылка на портфолио"),
    "contact_telegram": (10, "Telegram для связи"),
    "looking_for": (5, "Условия участия"),
}
COMPLETED_THRESHOLD = 80


def _filled(p: Profile) -> dict[str, bool]:
    return {
        "display_name": bool(p.display_name),
        "primary_role": p.primary_role_id is not None,
        "headline": bool(p.headline),
        "bio": len(p.bio) >= 30,
        "skills": len(p.skills) >= 3,
        "links": len(p.links) >= 1,
        "contact_telegram": bool(p.contact_telegram),
        "looking_for": bool(p.looking_for),
    }


def completeness(p: Profile) -> tuple[int, list[str]]:
    filled = _filled(p)
    score = sum(w for k, (w, _) in _WEIGHTS.items() if filled[k])
    missing = [label for k, (_, label) in _WEIGHTS.items() if not filled[k]]
    return score, missing


def publish_blockers(user: User, p: Profile) -> list[str]:
    blockers = []
    if not user.email_verified:
        blockers.append("Подтвердите email")
    if not p.display_name:
        blockers.append("Укажите имя")
    if p.primary_role_id is None:
        blockers.append("Выберите основную роль")
    if not p.skills:
        blockers.append("Добавьте навыки")
    if not p.looking_for:
        blockers.append("Укажите условия участия")
    return blockers


def to_card(p: Profile) -> PersonCard:
    return PersonCard(
        slug=p.slug,
        display_name=p.display_name or "Без имени",
        headline=p.headline,
        primary_role=RoleOut.model_validate(p.primary_role) if p.primary_role else None,
        experience_level=p.experience_level,
        availability=p.availability,
        looking_for=list(p.looking_for or []),
        city=p.city,
        skills=[SkillOut.model_validate(s) for s in p.skills],
        avatar_url=p.avatar_url,
        avatar_url_lg=p.avatar_url_lg,
        is_demo=is_demo(p.user),
    )


async def _memberships(db: AsyncSession, user_id) -> list[MembershipOut]:
    """Опыт на платформе: где человек основатель и в каких командах участник (KAN-94)."""
    visible = (Startup.status != StartupStatus.draft, Startup.is_hidden.is_(False))
    member_rows = await db.execute(
        select(Startup.slug, Startup.title, StartupMember.role_title, StartupMember.joined_at)
        .join(StartupMember, StartupMember.startup_id == Startup.id)
        .where(StartupMember.user_id == user_id, Startup.owner_id != user_id, *visible)
    )
    owner_rows = await db.execute(
        select(Startup.slug, Startup.title, Startup.published_at, Startup.created_at).where(
            Startup.owner_id == user_id, *visible
        )
    )
    items = [
        MembershipOut(startup_slug=s, startup_title=t, role_title=r, since=j)
        for s, t, r, j in member_rows
    ] + [
        MembershipOut(startup_slug=s, startup_title=t, role_title="Основатель", since=p or c)
        for s, t, p, c in owner_rows
    ]
    return sorted(items, key=lambda m: m.since, reverse=True)


async def to_detail(db: AsyncSession, p: Profile) -> PersonDetail:
    return PersonDetail(
        **to_card(p).model_dump(),
        bio=p.bio,
        links=[LinkOut.model_validate(link) for link in p.links],
        memberships=await _memberships(db, p.user_id),
    )


def apply_blockers(user: User, p: Profile | None) -> list[str]:
    """Минимум для отклика (гипотеза H6): мягче, чем для публикации в каталоге."""
    blockers = []
    if not user.email_verified:
        blockers.append("Подтвердите email")
    if p is None or not p.display_name:
        blockers.append("Укажите имя")
    if p is None or p.primary_role_id is None:
        blockers.append("Выберите основную роль")
    if p is None or (not p.links and len(p.skills) < 2):
        blockers.append("Добавьте ссылку на работу или хотя бы 2 навыка")
    return blockers


async def my_profile(db: AsyncSession, user: User) -> MyProfileOut:
    p = user.profile
    assert p is not None
    score, missing = completeness(p)
    detail = await to_detail(db, p)
    # Себе показываем имя как есть: заглушка «Без имени» нужна только в каталоге,
    # а в кабинете давала «Привет, Без имени» и инициалы «БИ».
    return MyProfileOut(
        **(detail.model_dump() | {"display_name": p.display_name}),
        is_published=p.is_published,
        contact_telegram=p.contact_telegram,
        show_email=p.show_email,
        completeness=score,
        missing=missing,
        can_publish=not publish_blockers(user, p),
        apply_blockers=apply_blockers(user, p),
    )


async def update_profile(db: AsyncSession, user: User, data: ProfileUpdate) -> None:
    p = user.profile
    assert p is not None
    before, _ = completeness(p)
    fields = data.model_dump(exclude_unset=True, exclude={"primary_role", "skills", "links"})
    for key, value in fields.items():
        if key == "looking_for":
            value = [str(v) for v in value or []]
        setattr(p, key, value.strip() if isinstance(value, str) else value)
    if p.contact_telegram:
        p.contact_telegram = p.contact_telegram.lstrip("@")

    if "primary_role" in data.model_fields_set:
        if data.primary_role is None:
            p.primary_role_id = None
        else:
            role = await db.scalar(select(Role).where(Role.slug == data.primary_role))
            if role is None:
                raise AppError("Неизвестная роль", {"field": "primary_role"})
            p.primary_role_id = role.id
            p.primary_role = role
    if data.skills is not None:
        skills = list(await db.scalars(select(Skill).where(Skill.slug.in_(data.skills))))
        if len(skills) != len(set(data.skills)):
            raise AppError("Неизвестный навык", {"field": "skills"})
        p.skills = skills
    if data.links is not None:
        p.links = [ProfileLink(kind=link.kind, url=str(link.url)) for link in data.links]

    # Slug строим из имени, пока профиль ещё не публиковали (ссылки не разошлись).
    if "display_name" in fields and p.slug.startswith("u-") and p.display_name:
        p.slug = await unique_slug(db, Profile, p.display_name, exclude_id=p.id)

    after, _ = completeness(p)
    if before < COMPLETED_THRESHOLD <= after:
        track(db, "profile_completed", user.id, "profile", p.id, completeness=after)
    await db.commit()


async def set_published(db: AsyncSession, user: User, published: bool) -> None:
    p = user.profile
    assert p is not None
    if published:
        blockers = publish_blockers(user, p)
        if blockers:
            raise AppError("Профиль пока нельзя опубликовать", blockers)
        if not p.is_published:
            track(db, "profile_published", user.id, "profile", p.id)
    p.is_published = published
    await db.commit()


def _people_query() -> Select:
    return (
        select(Profile)
        .join(User, User.id == Profile.user_id)
        .where(Profile.is_published.is_(True), User.is_active.is_(True))
    )


async def list_people(
    db: AsyncSession,
    roles: list[str],
    skills: list[str],
    levels: list[str],
    looking_for: list[str],
    q: str | None,
    limit: int,
    offset: int,
) -> tuple[list[Profile], int]:
    # Порог каталога: роль, описание в одну строку и хотя бы один навык. Пустые карточки
    # отталкивают основателей; по прямой ссылке профиль по-прежнему открывается.
    stmt = _people_query().where(
        Profile.primary_role_id.is_not(None),
        Profile.headline != "",
        exists().where(profile_skills.c.profile_id == Profile.id),
    )
    if roles:
        stmt = stmt.join(Role, Role.id == Profile.primary_role_id).where(Role.slug.in_(roles))
    if skills:
        sub = (
            select(profile_skills.c.profile_id)
            .join(Skill, Skill.id == profile_skills.c.skill_id)
            .where(Skill.slug.in_(skills))
        )
        stmt = stmt.where(Profile.id.in_(sub))
    if levels:
        stmt = stmt.where(Profile.experience_level.in_(levels))
    if looking_for:
        stmt = stmt.where(Profile.looking_for.overlap(looking_for))
    q = (q or "").strip()
    # Сначала профили с описанием: пустые карточки в начале каталога отталкивают основателей.
    order = [(Profile.headline == "").asc(), Profile.updated_at.desc()]
    if len(q) >= search.MIN_FTS_LEN:
        tsq = search.query(q)
        # Человек находится по своему тексту или по названию основной роли («дизайнеры»).
        role_hit = (
            exists()
            .where(Role.id == Profile.primary_role_id)
            .where(func.to_tsvector(search.CONFIG, Role.name).op("@@")(tsq))
        )
        stmt = stmt.where(or_(Profile.search.op("@@")(tsq), role_hit))
        order.insert(0, func.ts_rank(Profile.search, tsq).desc())
    elif q:
        stmt = stmt.where(Profile.display_name.ilike(f"{q}%"))
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = await db.scalars(stmt.order_by(*order).limit(limit).offset(offset))
    return list(rows.unique()), total or 0


async def get_public(db: AsyncSession, slug: str, viewer: User | None = None) -> Profile:
    p = await db.scalar(_people_query().where(Profile.slug == slug))
    if p is not None:
        return p
    # Неопубликованный профиль видит основатель, на чей стартап человек откликнулся (KAN-83).
    if viewer is not None:
        p = await db.scalar(
            select(Profile)
            .join(User, User.id == Profile.user_id)
            .where(Profile.slug == slug, User.is_active.is_(True))
            .where(
                exists()
                .where(Application.applicant_id == Profile.user_id)
                .where(Application.startup_role_id == StartupRole.id)
                .where(StartupRole.startup_id == Startup.id, Startup.owner_id == viewer.id)
            )
        )
        if p is not None:
            return p
    raise NotFound("Профиль не найден")


async def get_by_slug_any(db: AsyncSession, slug: str) -> Profile:
    p = await db.scalar(select(Profile).where(and_(Profile.slug == slug)))
    if p is None:
        raise NotFound("Профиль не найден")
    return p
