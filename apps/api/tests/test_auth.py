import re

from app.core.config import get_settings
from app.services import mail


def _token_from_mail(index: int = -1) -> str:
    body = mail.outbox[index].get_body(("plain",)).get_content()
    return re.search(r"token=([\w-]+)", body).group(1)


async def test_register_login_me_logout(client):
    r = await client.post(
        "/api/auth/register", json={"email": "Maria@Mail.ru", "password": "secret-pass-1"}
    )
    assert r.status_code == 201
    assert r.json()["email"] == "maria@mail.ru"
    assert "session" in r.cookies

    me = await client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email_verified"] is False
    assert me.json()["profile"]["is_published"] is False

    assert (await client.post("/api/auth/logout")).status_code == 200
    assert (await client.get("/api/auth/me")).status_code == 401

    r = await client.post(
        "/api/auth/login", json={"email": "maria@mail.ru", "password": "secret-pass-1"}
    )
    assert r.status_code == 200
    assert (await client.get("/api/auth/me")).status_code == 200


async def test_duplicate_email(client):
    data = {"email": "a@a.ru", "password": "secret-pass-1"}
    assert (await client.post("/api/auth/register", json=data)).status_code == 201
    r = await client.post("/api/auth/register", json=data)
    assert r.status_code == 409


async def test_wrong_password_and_unknown_user_same_message(client):
    await client.post("/api/auth/register", json={"email": "a@a.ru", "password": "secret-pass-1"})
    wrong = await client.post("/api/auth/login", json={"email": "a@a.ru", "password": "nope-nope"})
    unknown = await client.post(
        "/api/auth/login", json={"email": "x@x.ru", "password": "nope-nope"}
    )
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json()["error"]["message"] == unknown.json()["error"]["message"]


async def test_email_verification(client):
    await client.post("/api/auth/register", json={"email": "a@a.ru", "password": "secret-pass-1"})
    assert len(mail.outbox) == 1
    token = _token_from_mail()
    assert (await client.post("/api/auth/verify-email", json={"token": token})).status_code == 200
    assert (await client.get("/api/auth/me")).json()["email_verified"] is True
    # Токен одноразовый.
    assert (await client.post("/api/auth/verify-email", json={"token": token})).status_code == 400


async def test_password_reset_invalidates_sessions(client):
    await client.post("/api/auth/register", json={"email": "a@a.ru", "password": "secret-pass-1"})
    await client.post("/api/auth/password/forgot", json={"email": "a@a.ru"})
    token = _token_from_mail()
    r = await client.post(
        "/api/auth/password/reset", json={"token": token, "password": "brand-new-pass"}
    )
    assert r.status_code == 200
    assert (await client.get("/api/auth/me")).status_code == 401
    r = await client.post("/api/auth/login", json={"email": "a@a.ru", "password": "brand-new-pass"})
    assert r.status_code == 200


async def test_forgot_does_not_reveal_users(client):
    r = await client.post("/api/auth/password/forgot", json={"email": "ghost@nowhere.ru"})
    assert r.status_code == 200
    assert mail.outbox == []


async def test_login_rate_limit(client):
    s = get_settings()
    old = s.auth_rate_limit
    s.auth_rate_limit = 5
    try:
        await client.post(
            "/api/auth/register", json={"email": "a@a.ru", "password": "secret-pass-1"}
        )
        for _ in range(5):
            r = await client.post(
                "/api/auth/login", json={"email": "a@a.ru", "password": "wrong-pass"}
            )
            assert r.status_code == 401
        r = await client.post(
            "/api/auth/login", json={"email": "a@a.ru", "password": "secret-pass-1"}
        )
        assert r.status_code == 429
    finally:
        s.auth_rate_limit = old


async def test_change_password_and_delete_account(client):
    await client.post("/api/auth/register", json={"email": "a@a.ru", "password": "secret-pass-1"})
    r = await client.post(
        "/api/auth/password/change",
        json={"current_password": "bad", "new_password": "another-pass"},
    )
    assert r.status_code == 400
    r = await client.post(
        "/api/auth/password/change",
        json={"current_password": "secret-pass-1", "new_password": "another-pass"},
    )
    assert r.status_code == 200
    assert (await client.delete("/api/auth/account")).status_code == 200
    r = await client.post("/api/auth/login", json={"email": "a@a.ru", "password": "another-pass"})
    assert r.status_code == 401
