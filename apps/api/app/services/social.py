"""Вход через Telegram и VK ID.

Telegram: oauth.telegram.org возвращает данные пользователя с подписью HMAC от токена бота —
проверяем подпись и свежесть. VK ID: OAuth 2.1 с PKCE — меняем code на токен и берём профиль.
Новый пользователь получает служебный email в домене .invalid (письма туда не уходят): почту
можно указать потом в настройках.
"""

import base64
import hashlib
import hmac
import secrets
import time

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError
from app.models import Profile, SocialAccount, User
from app.services.auth import create_session
from app.services.events import track

TELEGRAM_MAX_AGE = 86400


def providers() -> dict[str, bool]:
    s = get_settings()
    return {"telegram": bool(s.telegram_bot_token), "vk": bool(s.vk_client_id)}


def telegram_bot_id() -> str:
    return get_settings().telegram_bot_token.split(":", 1)[0]


def check_telegram(data: dict[str, str]) -> dict[str, str]:
    """Проверка подписи (core.telegram.org/widgets/login#checking-authorization)."""
    token = get_settings().telegram_bot_token
    if not token:
        raise AppError("Вход через Telegram не настроен")
    received = data.get("hash", "")
    check = "\n".join(f"{k}={v}" for k, v in sorted(data.items()) if k != "hash")
    secret = hashlib.sha256(token.encode()).digest()
    expected = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received):
        raise AppError("Не удалось проверить вход через Telegram")
    if time.time() - int(data.get("auth_date", "0")) > TELEGRAM_MAX_AGE:
        raise AppError("Ссылка входа устарела, попробуй ещё раз")
    return data


async def login_social(
    db: AsyncSession, provider: str, uid: str, name: str, user_agent: str = ""
) -> tuple[User, str, bool]:
    """Найти или создать пользователя по аккаунту провайдера. Возвращает (user, token, новый ли)."""
    acc = await db.scalar(
        select(SocialAccount).where(
            SocialAccount.provider == provider, SocialAccount.provider_user_id == uid
        )
    )
    created = False
    if acc is not None:
        user = await db.get(User, acc.user_id)
        if user is None or not user.is_active:
            raise AppError("Аккаунт заблокирован")
    else:
        user = User(
            email=f"{provider}-{uid}-{secrets.token_hex(3)}@users.invalid", password_hash=None
        )
        user.profile = Profile(
            slug=f"u-{secrets.token_hex(4)}",
            display_name=name[:80],
            looking_for=[],
            skills=[],
            links=[],
        )
        db.add(user)
        await db.flush()
        db.add(SocialAccount(user_id=user.id, provider=provider, provider_user_id=uid))
        track(db, "signup", user.id, "user", user.id, method=provider, utm_source="direct")
        created = True
    token = await create_session(db, user, user_agent)
    await db.commit()
    return user, token, created


def vk_pkce() -> tuple[str, str, str]:
    """(state, verifier, challenge) для авторизации VK ID."""
    verifier = secrets.token_urlsafe(48)
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    )
    return secrets.token_urlsafe(16), verifier, challenge


async def vk_exchange(code: str, verifier: str, device_id: str, state: str) -> tuple[str, str]:
    """code → access_token → (vk user_id, имя)."""
    s = get_settings()
    redirect = s.site_url.rstrip("/") + "/api/auth/vk/callback"
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.post(
            "https://id.vk.com/oauth2/auth",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "code_verifier": verifier,
                "client_id": s.vk_client_id,
                "device_id": device_id,
                "redirect_uri": redirect,
                "state": state,
            },
        )
        tok = r.json()
        if "access_token" not in tok:
            raise AppError("VK ID не подтвердил вход")
        r = await http.post(
            "https://id.vk.com/oauth2/user_info",
            data={"client_id": s.vk_client_id, "access_token": tok["access_token"]},
        )
        info = r.json().get("user", {})
    uid = str(info.get("user_id") or tok.get("user_id") or "")
    if not uid:
        raise AppError("VK ID не вернул профиль")
    name = " ".join(x for x in (info.get("first_name"), info.get("last_name")) if x)
    return uid, name
