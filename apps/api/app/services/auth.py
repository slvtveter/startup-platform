import hashlib
import hmac
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError, Conflict, EmailUnverified, TooManyRequests, Unauthorized
from app.core.security import check_password, hash_password_async, hash_token, new_token
from app.models import EmailToken, Profile, Session, User
from app.models.enums import TokenPurpose
from app.services import consents, mail, ratelimit
from app.services import startups as startup_service
from app.services.events import track


def _now() -> datetime:
    return datetime.now(UTC)


# Больше этого числа активных сеансов на человека не держим: старые входы удаляются.
MAX_SESSIONS = 10


async def create_session(db: AsyncSession, user: User, user_agent: str = "") -> str:
    token = new_token()
    days = get_settings().session_ttl_days
    # Чистим протухшие и лишние сеансы: иначе в настройках копятся десятки «входов».
    await db.execute(
        delete(Session).where(Session.user_id == user.id, Session.expires_at <= _now())
    )
    keep = (
        select(Session.id)
        .where(Session.user_id == user.id)
        .order_by(func.coalesce(Session.last_seen_at, Session.created_at).desc())
        .limit(MAX_SESSIONS - 1)
    )
    await db.execute(delete(Session).where(Session.user_id == user.id, Session.id.not_in(keep)))
    db.add(
        Session(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=_now() + timedelta(days=days),
            user_agent=user_agent[:300],
        )
    )
    return token


async def list_sessions(db: AsyncSession, user: User) -> list[Session]:
    rows = await db.scalars(
        select(Session)
        .where(Session.user_id == user.id, Session.expires_at > _now())
        .order_by(func.coalesce(Session.last_seen_at, Session.created_at).desc())
    )
    return list(rows)


async def revoke_session(db: AsyncSession, user: User, session_id: uuid.UUID) -> None:
    await db.execute(delete(Session).where(Session.id == session_id, Session.user_id == user.id))
    await db.commit()


async def revoke_other_sessions(db: AsyncSession, user: User, current_token: str) -> None:
    """«Выйти на всех других устройствах»: текущая сессия остаётся."""
    await db.execute(
        delete(Session).where(
            Session.user_id == user.id, Session.token_hash != hash_token(current_token)
        )
    )
    await db.commit()


async def user_by_session(db: AsyncSession, token: str) -> User | None:
    session = await db.scalar(
        select(Session).where(Session.token_hash == hash_token(token), Session.expires_at > _now())
    )
    if session is None or not session.user.is_active:
        return None
    seen = session.last_seen_at or session.created_at
    if seen is None or _now() - seen > timedelta(minutes=10):
        await db.execute(
            update(Session).where(Session.id == session.id).values(last_seen_at=_now())
        )
        await db.commit()
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


# --- Коды из письма ---
# Вход по почте подтверждаем 6-значным кодом: без него аккаунт на чужой адрес не получить.

CODE_TTL = timedelta(minutes=15)
# Неверных вводов на один код; дальше только новый код.
CODE_ATTEMPTS = 5
_WRONG_CODE = "Неверный код. Проверь письмо или запроси новый."


def _code_hash(row_id: uuid.UUID, code: str) -> str:
    # HMAC с секретом и id строки: по утёкшей таблице миллион вариантов не перебрать.
    key = get_settings().secret_key.encode()
    return hmac.new(key, f"{row_id}:{code}".encode(), hashlib.sha256).hexdigest()


def _code_mail(purpose: TokenPurpose, code: str) -> tuple[str, str, str]:
    """Тема, заголовок и текст письма с кодом. Код в теме виден прямо в уведомлении."""
    if purpose == TokenPurpose.reset_code:
        return (
            f"{code} — код для сброса пароля Envola",
            "Сброс пароля",
            "Введите этот код на странице сброса пароля:\n\n"
            f"{code}\n\nКод действует 15 минут. Если вы не запрашивали сброс, "
            "просто проигнорируйте письмо: пароль останется прежним.",
        )
    return (
        f"{code} — код подтверждения Envola",
        "Подтвердите почту",
        "Введите этот код на сайте, чтобы закончить вход:\n\n"
        f"{code}\n\nКод действует 15 минут. Если это были не вы, просто проигнорируйте письмо.",
    )


async def send_code(db: AsyncSession, user: User, purpose: TokenPurpose) -> None:
    """Новый код вместо прежнего: старые коды той же цели перестают работать."""
    key = f"send-code:{user.id}"
    await ratelimit.ensure_allowed(
        db, key, message="Слишком много писем подряд. Попробуйте через 15 минут."
    )
    ratelimit.hit(db, key)
    await db.execute(
        update(EmailToken)
        .where(
            EmailToken.user_id == user.id,
            EmailToken.purpose == purpose,
            EmailToken.used_at.is_(None),
        )
        .values(used_at=_now())
    )
    code = f"{secrets.randbelow(10**6):06d}"
    row_id = uuid.uuid4()
    db.add(
        EmailToken(
            id=row_id,
            user_id=user.id,
            purpose=purpose,
            token_hash=_code_hash(row_id, code),
            expires_at=_now() + CODE_TTL,
        )
    )
    await ratelimit.reset(db, f"code:{user.id}")
    await db.commit()
    subject, title, body = _code_mail(purpose, code)
    await mail.send_mail(user.email, subject, body, title=title)


async def _check_code(db: AsyncSession, email: str, code: str, purpose: TokenPurpose) -> User:
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not user.is_active:
        raise AppError(_WRONG_CODE)
    key = f"code:{user.id}"
    await ratelimit.ensure_allowed(
        db, key, CODE_ATTEMPTS, "Слишком много неверных попыток. Запроси новый код."
    )
    row = await db.scalar(
        select(EmailToken)
        .where(
            EmailToken.user_id == user.id,
            EmailToken.purpose == purpose,
            EmailToken.used_at.is_(None),
        )
        .order_by(EmailToken.created_at.desc())
        .limit(1)
    )
    if row is None or row.expires_at < _now():
        raise AppError("Код устарел. Запроси новый.")
    if not hmac.compare_digest(row.token_hash, _code_hash(row.id, code)):
        ratelimit.hit(db, key)
        await db.commit()
        raise AppError(_WRONG_CODE)
    row.used_at = _now()
    await ratelimit.reset(db, key)
    return user


async def _mark_verified(db: AsyncSession, user: User) -> bool:
    """True, если почта подтверждена впервые."""
    if user.email_verified_at is not None:
        return False
    user.email_verified_at = _now()
    track(db, "email_verified", user.id, "user", user.id)
    # Стартап, который админ перенёс на этот email, переходит к владельцу (KAN-75).
    await startup_service.claim_pending(db, user)
    return True


async def verify_code(
    db: AsyncSession, email: str, code: str, user_agent: str = ""
) -> tuple[User, str, bool]:
    """Код из письма после регистрации или входа: почта подтверждена, человек вошёл.

    Третье значение — аккаунт только что создан (дальше развилка /welcome).
    """
    user = await _check_code(db, email, code, TokenPurpose.email_code)
    first = await _mark_verified(db, user)
    token = await create_session(db, user, user_agent)
    await db.commit()
    return user, token, first and _now() - user.created_at < timedelta(days=1)


async def resend_code(db: AsyncSession, email: str, purpose: TokenPurpose, ip: str) -> None:
    key = f"resend-code:{ip}"
    await ratelimit.ensure_allowed(db, key, get_settings().auth_rate_limit * 4)
    ratelimit.hit(db, key)
    user = await db.scalar(select(User).where(User.email == email))
    wanted = user is not None and user.is_active
    if wanted and purpose == TokenPurpose.email_code:
        wanted = not user.email_verified
    if not wanted:
        await db.commit()
        return  # не раскрываем, есть ли такой пользователь
    await send_code(db, user, purpose)


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
    db: AsyncSession,
    email: str,
    password: str,
    ip: str,
    utm_source: str | None,
    user_agent: str = "",
    publish_consent: bool = False,
) -> None:
    """Аккаунт без входа: войти можно только после кода из письма (verify_code).

    Галочки «принимаю соглашение» и «мне есть 18» проверяет схема, здесь — запись в журнал.
    """
    key = f"register:{ip}"
    await ratelimit.ensure_allowed(db, key)
    ratelimit.hit(db, key)
    user = await db.scalar(select(User).where(User.email == email))
    if user is not None and (user.email_verified or not user.is_active):
        await db.commit()
        raise Conflict("Аккаунт с этой почтой уже есть. Войди или восстанови пароль.")
    if user is None:
        user = User(email=email, password_hash=await hash_password_async(password))
        user.profile = Profile(
            slug=f"u-{secrets.token_hex(4)}", looking_for=[], skills=[], links=[]
        )
        db.add(user)
        await db.flush()
        utm = utm_source or "direct"
        track(db, "signup", user.id, "user", user.id, method="email", utm_source=utm)
    else:
        # Почта так и не подтверждена: повторная регистрация задаёт пароль заново.
        # Чужой аккаунт так не забрать — войти всё равно можно только с кодом из письма.
        user.password_hash = await hash_password_async(password)
    consents.record_terms(db, user, "register", ip, user_agent)
    if publish_consent and not consents.has_publication(user):
        consents.record_publication(db, user, "register", ip, user_agent)
    await send_code(db, user, TokenPurpose.email_code)  # делает commit


async def login(
    db: AsyncSession, email: str, password: str, ip: str, user_agent: str = ""
) -> tuple[User, str]:
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
    if not user.email_verified:
        try:
            await send_code(db, user, TokenPurpose.email_code)
        except TooManyRequests:
            await db.commit()  # код уже ушёл недавно: просим ввести его
        raise EmailUnverified(f"Подтверди почту: мы отправили код на {user.email}")
    token = await create_session(db, user, user_agent)
    await db.commit()
    return user, token


async def verify_email(db: AsyncSession, token: str) -> User:
    user, _ = await _consume_email_token(db, token, TokenPurpose.verify_email)
    await _mark_verified(db, user)
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
    await send_code(db, user, TokenPurpose.reset_code)


async def reset_password(db: AsyncSession, token: str, password: str) -> None:
    user, _ = await _consume_email_token(db, token, TokenPurpose.reset_password)
    user.password_hash = await hash_password_async(password)
    await db.execute(delete(Session).where(Session.user_id == user.id))
    await db.commit()


async def reset_with_code(
    db: AsyncSession, email: str, code: str, password: str, user_agent: str = ""
) -> tuple[User, str]:
    """Сброс по коду: новый пароль, остальные устройства выходят, человек сразу вошёл."""
    user = await _check_code(db, email, code, TokenPurpose.reset_code)
    user.password_hash = await hash_password_async(password)
    await db.execute(delete(Session).where(Session.user_id == user.id))
    await _mark_verified(db, user)  # код пришёл на эту почту — владение доказано
    await ratelimit.reset(db, f"login:{email}")
    token = await create_session(db, user, user_agent)
    await db.commit()
    return user, token


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
    """Профиль, сессии, стартапы и отклики удаляются каскадом (ON DELETE CASCADE).
    Файлы (фото, резюме, обложки стартапов) — тоже персональные данные: удаляем после commit."""
    from app.models import Startup
    from app.services import avatars, covers
    from app.services.storage import get_storage

    p = user.profile
    avatar = p.avatar_key if p else None
    resume = p.resume_key if p else None
    cover_keys = list(
        await db.scalars(select(Startup.cover_key).where(Startup.owner_id == user.id))
    )
    await db.delete(user)
    await db.commit()
    storage = get_storage()
    if avatar:
        for size in avatars.SIZES:
            storage.delete(f"{avatar}-{size}.webp")
    if resume:
        storage.delete(resume)
    for key in cover_keys:
        covers.drop(key)
