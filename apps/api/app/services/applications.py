import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError, Conflict, Forbidden, NotFound
from app.models import Application, Profile, Startup, StartupRole, User
from app.models.enums import ApplicationDirection, ApplicationStatus, StartupStatus
from app.schemas.application import ApplicationOut, ContactsOut
from app.services import mail
from app.services import profiles as profile_service
from app.services import startups as startup_service
from app.services.events import track

DAILY_LIMIT = 10


def _now() -> datetime:
    return datetime.now(UTC)


def _decider_id(app: Application) -> uuid.UUID:
    # Отклик решает основатель, приглашение решает приглашённый.
    if app.direction == ApplicationDirection.apply:
        return app.startup_role.startup.owner_id
    return app.applicant_id


def _contacts(user: User) -> ContactsOut:
    p = user.profile
    return ContactsOut(
        display_name=(p.display_name if p and p.display_name else user.email.split("@")[0]),
        email=user.email if (p is None or p.show_email) else None,
        telegram=(p.contact_telegram or None) if p else None,
    )


def to_out(app: Application, viewer: User) -> ApplicationOut:
    role = app.startup_role
    startup = role.startup
    contacts = None
    if app.status == ApplicationStatus.accepted:
        other = startup.owner if viewer.id == app.applicant_id else app.applicant
        contacts = _contacts(other)
    return ApplicationOut(
        id=str(app.id),
        direction=app.direction,
        status=app.status,
        message=app.message,
        decision_note=app.decision_note,
        created_at=app.created_at,
        decided_at=app.decided_at,
        startup_slug=startup.slug,
        startup_title=startup.title,
        role_id=str(role.id),
        role_title=role.title,
        applicant=profile_service.to_card(app.applicant.profile) if app.applicant.profile else None,
        contacts=contacts,
        can_decide=app.status == ApplicationStatus.pending and _decider_id(app) == viewer.id,
        can_withdraw=app.status == ApplicationStatus.pending
        and app.direction == ApplicationDirection.apply
        and app.applicant_id == viewer.id,
    )


async def _check_daily_limit(
    db: AsyncSession, field, user_id: uuid.UUID, direction: ApplicationDirection
) -> None:
    since = _now() - timedelta(days=1)
    count = await db.scalar(
        select(func.count()).where(
            field == user_id, Application.direction == direction, Application.created_at > since
        )
    )
    if (count or 0) >= DAILY_LIMIT:
        raise AppError("Достигнут дневной лимит. Попробуйте завтра.")


async def _open_role(db: AsyncSession, role_id: uuid.UUID) -> StartupRole:
    role = await db.get(StartupRole, role_id)
    if role is None:
        raise NotFound("Роль не найдена")
    s = role.startup
    if s.status != StartupStatus.recruiting or s.is_hidden or not role.is_open:
        raise AppError("Набор на эту роль закрыт")
    return role


async def _save(db: AsyncSession, app: Application) -> Application:
    db.add(app)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise Conflict("У вас уже есть активный отклик на эту роль") from exc
    return await db.scalar(select(Application).where(Application.id == app.id))


async def apply(db: AsyncSession, user: User, role_id: uuid.UUID, message: str) -> Application:
    role = await _open_role(db, role_id)
    if role.startup.owner_id == user.id:
        raise AppError("Нельзя откликнуться на свой стартап")
    blockers = profile_service.apply_blockers(user, user.profile)
    if blockers:
        raise AppError("Чтобы откликнуться, дополните профиль", blockers)
    await _check_daily_limit(db, Application.applicant_id, user.id, ApplicationDirection.apply)
    app = Application(
        startup_role_id=role.id,
        applicant_id=user.id,
        direction=ApplicationDirection.apply,
        message=message,
    )
    track(db, "application_sent", user.id, "startup_role", role.id, startup_id=str(role.startup_id))
    app = await _save(db, app)
    owner = role.startup.owner
    await mail.send_mail(
        owner.email,
        f"Новый отклик на роль «{role.title}»",
        f"{_contacts(user).display_name} откликается на роль «{role.title}» "
        f"в {role.startup.title}.\n\n"
        f"{message}\n\nОтветить: {mail.link('/me/startups/' + role.startup.slug)}",
        user=owner,
        kind="applications",
    )
    return app


async def invite(
    db: AsyncSession, founder: User, person_slug: str, role_id: uuid.UUID, message: str
) -> Application:
    role = await _open_role(db, role_id)
    if role.startup.owner_id != founder.id:
        raise Forbidden("Приглашать можно только в свой стартап")
    target: Profile = await profile_service.get_public(db, person_slug)
    if target.user_id == founder.id:
        raise AppError("Нельзя пригласить самого себя")
    # Счётчик приглашений считаем по стартапам основателя.
    since = _now() - timedelta(days=1)
    sent = await db.scalar(
        select(func.count())
        .select_from(Application)
        .join(StartupRole, StartupRole.id == Application.startup_role_id)
        .join(Startup, Startup.id == StartupRole.startup_id)
        .where(
            Startup.owner_id == founder.id,
            Application.direction == ApplicationDirection.invite,
            Application.created_at > since,
        )
    )
    if (sent or 0) >= DAILY_LIMIT:
        raise AppError("Достигнут дневной лимит приглашений. Попробуйте завтра.")
    app = Application(
        startup_role_id=role.id,
        applicant_id=target.user_id,
        direction=ApplicationDirection.invite,
        message=message,
    )
    track(db, "invite_sent", founder.id, "startup_role", role.id, startup_id=str(role.startup_id))
    app = await _save(db, app)
    await mail.send_mail(
        target.user.email,
        f"Вас пригласили в {role.startup.title}",
        f"Основатель {role.startup.title} приглашает вас на роль «{role.title}».\n\n{message}\n\n"
        f"Ответить: {mail.link('/me/applications')}",
        user=target.user,
        kind="invites",
    )
    return app


async def get_visible(db: AsyncSession, app_id: uuid.UUID, user: User) -> Application:
    app = await db.get(Application, app_id)
    if app is None:
        raise NotFound("Отклик не найден")
    if user.id not in (app.applicant_id, app.startup_role.startup.owner_id) and not user.is_admin:
        raise NotFound("Отклик не найден")
    return app


async def withdraw(db: AsyncSession, user: User, app_id: uuid.UUID) -> Application:
    app = await get_visible(db, app_id, user)
    if app.applicant_id != user.id or app.direction != ApplicationDirection.apply:
        raise Forbidden("Отозвать можно только свой отклик")
    if app.status != ApplicationStatus.pending:
        raise AppError("Отклик уже рассмотрен")
    app.status = ApplicationStatus.withdrawn
    app.decided_at = _now()
    await db.commit()
    return app


async def decide(
    db: AsyncSession, user: User, app_id: uuid.UUID, accept: bool, note: str
) -> Application:
    # Блокируем строку роли: два одновременных «принять» не займут одно место дважды.
    app = await get_visible(db, app_id, user)
    role = await db.scalar(
        select(StartupRole)
        .where(StartupRole.id == app.startup_role_id)
        .with_for_update(of=StartupRole)
    )
    await db.refresh(app)
    if _decider_id(app) != user.id:
        raise Forbidden("Решение принимает другая сторона")
    if app.status != ApplicationStatus.pending:
        raise AppError("Отклик уже рассмотрен")
    app.decided_at = _now()
    app.decision_note = note
    hours = (app.decided_at - app.created_at).total_seconds() / 3600
    if accept:
        accepted = await db.scalar(
            select(func.count()).where(
                Application.startup_role_id == role.id,
                Application.status == ApplicationStatus.accepted,
            )
        )
        if (accepted or 0) >= role.slots:
            raise AppError("Все места на этой роли уже заняты")
        app.status = ApplicationStatus.accepted
        await startup_service.add_member(db, role.startup_id, app.applicant_id, role.title)
        if (accepted or 0) + 1 >= role.slots:
            role.is_open = False
        track(
            db,
            "contacts_exchanged",
            user.id,
            "application",
            app.id,
            startup_id=str(role.startup_id),
        )
    else:
        app.status = ApplicationStatus.rejected
    track(
        db,
        "application_answered",
        user.id,
        "application",
        app.id,
        accepted=accept,
        hours=round(hours, 1),
        direction=str(app.direction),
    )
    await db.commit()

    other = app.applicant if user.id != app.applicant_id else role.startup.owner
    verdict = "приняли" if accept else "отклонили"
    # Ссылка ведёт прямо к карточке заявки с контактами и шагами «что дальше».
    page = (
        "/me/applications" if other.id == app.applicant_id else f"/me/startups/{role.startup.slug}"
    )
    await mail.send_mail(
        other.email,
        f"{role.startup.title}: решение по роли «{role.title}»",
        f"Ваш {'отклик' if app.direction == ApplicationDirection.apply else 'приглашение'} "
        f"{verdict}."
        + (f"\nКомментарий: {note}" if note else "")
        + (f"\n\nКонтакты открыты: {mail.link(f'{page}#app-{app.id}')}" if accept else ""),
        user=other,
        kind="decisions",
    )
    return app


async def mine(db: AsyncSession, user: User) -> list[Application]:
    rows = await db.scalars(
        select(Application)
        .where(Application.applicant_id == user.id)
        .order_by(Application.created_at.desc())
    )
    return list(rows.unique())


async def for_startup(db: AsyncSession, s: Startup, status: str | None) -> list[Application]:
    stmt = (
        select(Application)
        .join(StartupRole, StartupRole.id == Application.startup_role_id)
        .where(StartupRole.startup_id == s.id)
        .order_by(Application.created_at.desc())
    )
    if status:
        stmt = stmt.where(Application.status == status)
    return list((await db.scalars(stmt)).unique())


async def remind_stale(db: AsyncSession) -> int:
    """Напоминание основателям об откликах без ответа больше 48 часов (запускать по cron)."""
    since = _now() - timedelta(hours=48)
    rows = list(
        (
            await db.scalars(
                select(Application).where(
                    Application.status == ApplicationStatus.pending,
                    Application.direction == ApplicationDirection.apply,
                    Application.created_at < since,
                )
            )
        ).unique()
    )
    for app in rows:
        s = app.startup_role.startup
        await mail.send_mail(
            s.owner.email,
            f"{s.title}: отклик ждёт ответа",
            f"Отклик на роль «{app.startup_role.title}» ждёт ответа больше 48 часов.\n"
            f"{mail.link('/me/startups/' + s.slug)}",
            user=s.owner,
            kind="reminders",
        )
    return len(rows)
