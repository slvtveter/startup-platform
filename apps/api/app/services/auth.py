import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError, Conflict, Unauthorized
from app.core.security import hash_password, hash_token, new_token, verify_password
from app.models import EmailToken, Profile, Session, User
from app.models.enums import TokenPurpose
from app.services import mail, ratelimit
from app.services import startups as startup_service
from app.services.events import track


def _now() -> datetime:
    return datetime.now(UTC)


async def create_session(db: AsyncSession, user: User) -> str:
    token = new_token()
    days = get_settings().session_ttl_days
    db.add(
        Session(
            user_id=user.id, token_hash=hash_token(token), expires_at=_now() + timedelta(days=days)
        )
    )
    return token


async def user_by_session(db: AsyncSession, token: str) -> User | None:
    session = await db.scalar(
        select(Session).where(Session.token_hash == hash_token(token), Session.expires_at > _now())
    )
    if session is None or not session.user.is_active:
        return None
    return session.user


async def logout(db: AsyncSession, token: str) -> None:
    await db.execute(delete(Session).where(Session.token_hash == hash_token(token)))
    await db.commit()


async def _issue_email_token(
    db: AsyncSession, user: User, purpose: TokenPurpose, ttl: timedelta
) -> str:
    token = new_token()
    db.add(
        EmailToken(
            user_id=user.id, purpose=purpose, token_hash=hash_token(token), expires_at=_now() + ttl
        )
    )
    return token


async def _consume_email_token(db: AsyncSession, token: str, purpose: TokenPurpose) -> User:
    row = await db.scalar(
        select(EmailToken).where(
            EmailToken.token_hash == hash_token(token), EmailToken.purpose == purpose
        )
    )
    if row is None or row.used_at is not None or row.expires_at < _now():
        raise AppError("Ссылка недействительна или устарела. Запросите новую.")
    row.used_at = _now()
    user = await db.get(User, row.user_id)
    if user is None:
        raise AppError("Ссылка недействительна или устарела. Запросите новую.")
    return user


async def send_verification(db: AsyncSession, user: User) -> None:
    token = await _issue_email_token(db, user, TokenPurpose.verify_email, timedelta(hours=24))
    await db.commit()
    await mail.send_mail(
        user.email,
        "Подтвердите email",
        "Здравствуйте!\n\nЧтобы подтвердить почту, перейдите по ссылке:\n"
        f"{mail.link('/verify-email?token=' + token)}\n\nСсылка действует 24 часа.",
    )


async def register(
    db: AsyncSession, email: str, password: str, ip: str, utm_source: str | None
) -> tuple[User, str]:
    key = f"register:{ip}"
    await ratelimit.ensure_allowed(db, key)
    ratelimit.hit(db, key)
    if await db.scalar(select(User.id).where(User.email == email)):
        await db.commit()
        raise Conflict("Пользователь с таким email уже зарегистрирован")
    user = User(email=email, password_hash=hash_password(password))
    user.profile = Profile(slug=f"u-{secrets.token_hex(4)}", looking_for=[], skills=[], links=[])
    db.add(user)
    await db.flush()
    token = await create_session(db, user)
    track(db, "signup", user.id, "user", user.id, method="email", utm_source=utm_source or "direct")
    await send_verification(db, user)  # делает commit
    return user, token


async def login(db: AsyncSession, email: str, password: str, ip: str) -> tuple[User, str]:
    key = f"login:{email}"
    await ratelimit.ensure_allowed(db, key)
    user = await db.scalar(select(User).where(User.email == email))
    if (
        user is None
        or user.password_hash is None
        or not verify_password(password, user.password_hash)
    ):
        ratelimit.hit(db, key)
        ratelimit.hit(db, f"login-ip:{ip}")
        await db.commit()
        raise Unauthorized("Неверный email или пароль")
    if not user.is_active:
        raise Unauthorized("Аккаунт заблокирован")
    await ratelimit.reset(db, key)
    token = await create_session(db, user)
    await db.commit()
    return user, token


async def verify_email(db: AsyncSession, token: str) -> User:
    user = await _consume_email_token(db, token, TokenPurpose.verify_email)
    if user.email_verified_at is None:
        user.email_verified_at = _now()
        track(db, "email_verified", user.id, "user", user.id)
        # Стартап, который админ перенёс на этот email, переходит к владельцу (KAN-75).
        await startup_service.claim_pending(db, user)
    await db.commit()
    return user


async def forgot_password(db: AsyncSession, email: str, ip: str) -> None:
    key = f"forgot:{ip}"
    await ratelimit.ensure_allowed(db, key)
    ratelimit.hit(db, key)
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not user.is_active:
        await db.commit()
        return  # не раскрываем, есть ли такой пользователь
    token = await _issue_email_token(db, user, TokenPurpose.reset_password, timedelta(hours=1))
    await db.commit()
    await mail.send_mail(
        user.email,
        "Сброс пароля",
        "Чтобы задать новый пароль, перейдите по ссылке:\n"
        f"{mail.link('/reset-password?token=' + token)}\n\n"
        "Ссылка действует 1 час. Если вы не запрашивали сброс, просто проигнорируйте письмо.",
    )


async def reset_password(db: AsyncSession, token: str, password: str) -> None:
    user = await _consume_email_token(db, token, TokenPurpose.reset_password)
    user.password_hash = hash_password(password)
    await db.execute(delete(Session).where(Session.user_id == user.id))
    await db.commit()


async def change_password(db: AsyncSession, user: User, current: str, new: str) -> None:
    if user.password_hash is None or not verify_password(current, user.password_hash):
        raise AppError("Текущий пароль указан неверно")
    user.password_hash = hash_password(new)
    await db.commit()


async def delete_account(db: AsyncSession, user: User) -> None:
    # Профиль, сессии, стартапы и отклики удаляются каскадом (ON DELETE CASCADE).
    await db.delete(user)
    await db.commit()
