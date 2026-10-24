import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError, Conflict, Unauthorized
from app.core.security import check_password, hash_password_async, hash_token, new_token
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
    db: AsyncSession,
    user: User,
    purpose: TokenPurpose,
    ttl: timedelta,
    new_email: str | None = None,
) -> str:
    token = new_token()
    db.add(
        EmailToken(
            user_id=user.id,
            purpose=purpose,
            token_hash=hash_token(token),
            expires_at=_now() + ttl,
            new_email=new_email,
        )
    )
    return token


async def _consume_email_token(
    db: AsyncSession, token: str, purpose: TokenPurpose
) -> tuple[User, EmailToken]:
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
    return user, row


async def resend_verification(db: AsyncSession, user: User) -> None:
    key = f"resend-verification:{user.id}"
    await ratelimit.ensure_allowed(db, key)
    ratelimit.hit(db, key)
    await send_verification(db, user)


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
    user = User(email=email, password_hash=await hash_password_async(password))
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
    # Перебор паролей сразу по многим адресам с одного IP: лимит шире, чем на один адрес.
    await ratelimit.ensure_allowed(db, f"login-ip:{ip}", get_settings().auth_rate_limit * 4)
    user = await db.scalar(select(User).where(User.email == email))
    ok = await check_password(password, user.password_hash if user else None)
    if user is None or not ok:
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
    user, _ = await _consume_email_token(db, token, TokenPurpose.verify_email)
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
    user, _ = await _consume_email_token(db, token, TokenPurpose.reset_password)
    user.password_hash = await hash_password_async(password)
    await db.execute(delete(Session).where(Session.user_id == user.id))
    await db.commit()


async def change_password(
    db: AsyncSession, user: User, current: str, new: str, session_token: str
) -> None:
    # Лимит: украденная сессия не должна позволять подбирать текущий пароль.
    key = f"change-password:{user.id}"
    await ratelimit.ensure_allowed(db, key)
    if not await check_password(current, user.password_hash):
        ratelimit.hit(db, key)
        await db.commit()
        raise AppError("Текущий пароль указан неверно")
    user.password_hash = await hash_password_async(new)
    # Остальные устройства выходят из аккаунта: смена пароля часто реакция на взлом.
    await db.execute(
        delete(Session).where(
            Session.user_id == user.id, Session.token_hash != hash_token(session_token)
        )
    )
    await ratelimit.reset(db, key)
    await db.commit()


async def request_email_change(db: AsyncSession, user: User, new_email: str, password: str) -> None:
    """KAN-72: письмо со ссылкой уходит на новый адрес; старый работает до подтверждения."""
    key = f"change-email:{user.id}"
    await ratelimit.ensure_allowed(db, key)
    ratelimit.hit(db, key)
    if not await check_password(password, user.password_hash):
        await db.commit()
        raise AppError("Пароль указан неверно")
    new_email = new_email.lower()
    if new_email == user.email:
        await db.commit()
        raise AppError("Это ваш текущий адрес")
    if await db.scalar(select(User.id).where(User.email == new_email)):
        await db.commit()
        raise Conflict("Этот адрес уже занят другим аккаунтом")
    token = await _issue_email_token(
        db, user, TokenPurpose.change_email, timedelta(hours=24), new_email=new_email
    )
    await db.commit()
    await mail.send_mail(
        new_email,
        "Подтвердите новый адрес почты",
        "Здравствуйте!\n\nЧтобы сделать этот адрес основным для входа, перейдите по ссылке:\n"
        f"{mail.link('/confirm-email?token=' + token)}\n\n"
        "Ссылка действует 24 часа. Если вы ничего не меняли, просто проигнорируйте письмо.",
    )
    await mail.send_mail(
        user.email,
        "Запрошена смена почты",
        f"Для вашего аккаунта запросили смену почты на {new_email}. Пока новый адрес не "
        "подтверждён, вход работает по этому. Если это были не вы, смените пароль в настройках.",
    )


async def confirm_email_change(db: AsyncSession, token: str) -> User:
    user, row = await _consume_email_token(db, token, TokenPurpose.change_email)
    if await db.scalar(select(User.id).where(User.email == row.new_email, User.id != user.id)):
        raise Conflict("Этот адрес уже занят другим аккаунтом")
    user.email = row.new_email
    user.email_verified_at = _now()  # переход по ссылке из письма доказывает владение адресом
    track(db, "email_changed", user.id, "user", user.id)
    await startup_service.claim_pending(db, user)
    await db.commit()
    return user


async def delete_account(db: AsyncSession, user: User) -> None:
    # Профиль, сессии, стартапы и отклики удаляются каскадом (ON DELETE CASCADE).
    await db.delete(user)
    await db.commit()
