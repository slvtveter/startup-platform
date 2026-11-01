"""Согласие с пользовательским соглашением и 18+: галочки при регистрации и экран после входа."""

import hashlib
import hmac
import time

from sqlalchemy import select

from app.core.config import get_settings
from app.core.legal import TERMS_VERSION
from app.db.session import SessionLocal
from app.models import Consent, User

TOKEN = "123456:test-bot-token"


async def _journal(email: str) -> list[Consent]:
    async with SessionLocal() as db:
        return list((await db.scalars(select(Consent).where(Consent.email == email))).all())


async def test_register_requires_both_checkboxes(client):
    base = {"email": "a@a.ru", "password": "secret-pass-1"}
    for body in (
        base,
        {**base, "accept_terms": True},
        {**base, "accept_terms": True, "adult": False},
    ):
        r = await client.post("/api/auth/register", json=body)
        assert r.status_code == 422, r.text
    async with SessionLocal() as db:
        assert await db.scalar(select(User).where(User.email == "a@a.ru")) is None


async def test_register_records_terms_and_age(make_user):
    c = await make_user("b@b.ru")
    assert (await c.get("/api/auth/me")).json()["needs_terms"] is False
    rows = await _journal("b@b.ru")
    assert sorted(r.kind for r in rows) == ["adult", "terms"]
    assert {r.version for r in rows} == {TERMS_VERSION}
    assert {r.source for r in rows} == {"register"}


async def test_social_signup_asks_for_terms_then_records(monkeypatch, client):
    monkeypatch.setattr(get_settings(), "telegram_bot_token", TOKEN)
    data = {"id": 7, "first_name": "Ева", "auth_date": int(time.time())}
    check = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    data["hash"] = hmac.new(
        hashlib.sha256(TOKEN.encode()).digest(), check.encode(), hashlib.sha256
    ).hexdigest()
    assert (await client.post("/api/auth/telegram", json=data)).status_code == 200
    me = (await client.get("/api/auth/me")).json()
    assert me["needs_terms"] is True

    assert (await client.post("/api/auth/terms", json={"accept_terms": True})).status_code == 422
    r = await client.post("/api/auth/terms", json={"accept_terms": True, "adult": True})
    assert r.status_code == 200, r.text
    assert r.json()["needs_terms"] is False
    rows = await _journal(me["email"])
    assert sorted((r.kind, r.source) for r in rows) == [("adult", "prompt"), ("terms", "prompt")]


async def test_terms_need_login(client):
    r = await client.post("/api/auth/terms", json={"accept_terms": True, "adult": True})
    assert r.status_code == 401


async def test_journal_survives_account_deletion(make_user):
    c = await make_user("gone@b.ru")
    assert (await c.delete("/api/auth/account")).status_code == 200
    assert len(await _journal("gone@b.ru")) == 2


async def test_purge_drops_old_security_logs(make_user):
    from datetime import UTC, datetime, timedelta

    from sqlalchemy import func

    from app.models import AuthAttempt, Session
    from app.services.cleanup import purge_expired

    await make_user("p@b.ru")
    async with SessionLocal() as db:
        db.add(AuthAttempt(key="login:x", created_at=datetime.now(UTC) - timedelta(days=40)))
        db.add(AuthAttempt(key="login:y"))
        await db.commit()
        await purge_expired(db)
        keys = await db.scalars(select(AuthAttempt.key).where(AuthAttempt.key.like("login:%")))
        assert list(keys) == ["login:y"]
        assert await db.scalar(select(func.count()).select_from(Session)) == 1
        # Через 31 день сессия истекла.
        await purge_expired(db, now=datetime.now(UTC) + timedelta(days=31))
        assert await db.scalar(select(func.count()).select_from(Session)) == 0


async def test_publication_needs_separate_consent(make_user):
    c = await make_user("pub@b.ru", published=True)
    me = (await c.get("/api/auth/me")).json()
    assert me["needs_publication_consent"] is False
    rows = await _journal("pub@b.ru")
    assert [r.kind for r in rows if r.kind == "publication"] == ["publication"]

    # Скрыть и снова опубликовать — согласие уже есть, галочка не нужна.
    assert (await c.post("/api/profile/me/publish", json={"published": False})).status_code == 200
    r = await c.post("/api/profile/me/publish", json={"published": True})
    assert r.status_code == 200, r.text


async def test_publish_without_consent_is_refused(make_user):
    c = await make_user("nopub@b.ru", published=True)
    async with SessionLocal() as db:
        u = await db.scalar(select(User).where(User.email == "nopub@b.ru"))
        u.publication_version = None
        await db.commit()
    # Старый опубликованный профиль без согласия: просим подтвердить, из каталога не убираем.
    me = (await c.get("/api/auth/me")).json()
    assert me["needs_publication_consent"] is True
    slug = me["profile"]["slug"]
    assert (await c.get(f"/api/people/{slug}")).status_code == 200
    await c.post("/api/profile/me/publish", json={"published": False})
    r = await c.post("/api/profile/me/publish", json={"published": True})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "publication_consent_required"
    r = await c.post("/api/profile/me/publish", json={"published": True, "consent": True})
    assert r.status_code == 200
    assert (await c.get("/api/auth/me")).json()["needs_publication_consent"] is False
    assert (await c.get(f"/api/people/{slug}")).status_code == 200


async def test_publication_consent_at_signup_skips_publish_dialog(client):
    from app.services import mail

    email = "early@b.ru"
    r = await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "secret-pass-1",
            "accept_terms": True,
            "adult": True,
            "publish_consent": True,
        },
    )
    assert r.status_code == 202, r.text
    rows = await _journal(email)
    assert sorted((r.kind, r.source) for r in rows) == [
        ("adult", "register"),
        ("publication", "register"),
        ("terms", "register"),
    ]
    async with SessionLocal() as db:
        u = await db.scalar(select(User).where(User.email == email))
        assert u.publication_version is not None
    assert mail.outbox  # код ушёл как обычно


async def test_publication_consent_is_optional_at_signup(make_user):
    await make_user("later@b.ru")
    assert [r.kind for r in await _journal("later@b.ru") if r.kind == "publication"] == []


async def test_social_terms_prompt_can_record_publication(monkeypatch, client):
    monkeypatch.setattr(get_settings(), "telegram_bot_token", TOKEN)
    data = {"id": 8, "first_name": "Ян", "auth_date": int(time.time())}
    check = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    data["hash"] = hmac.new(
        hashlib.sha256(TOKEN.encode()).digest(), check.encode(), hashlib.sha256
    ).hexdigest()
    assert (await client.post("/api/auth/telegram", json=data)).status_code == 200
    email = (await client.get("/api/auth/me")).json()["email"]
    r = await client.post(
        "/api/auth/terms", json={"accept_terms": True, "adult": True, "publish_consent": True}
    )
    assert r.status_code == 200, r.text
    assert ("publication", "prompt") in {(r.kind, r.source) for r in await _journal(email)}
