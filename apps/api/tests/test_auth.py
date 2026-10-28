import re

from app.core.config import get_settings
from app.services import mail


def _token_from_mail(index: int = -1) -> str:
    body = mail.outbox[index].get_body(("plain",)).get_content()
    return re.search(r"token=([\w-]+)", body).group(1)


def _code_from_mail(index: int = -1) -> str:
    body = mail.outbox[index].get_body(("plain",)).get_content()
    return re.search(r"^(\d{6})$", body, re.M).group(1)


async def _signup(client, email: str = "a@a.ru", password: str = "secret-pass-1"):
    r = await client.post("/api/auth/register", json={"email": email, "password": password})
    assert r.status_code == 202, r.text
    r = await client.post("/api/auth/code", json={"email": email, "code": _code_from_mail()})
    assert r.status_code == 200, r.text
    return r


async def test_register_needs_code_from_mail(client):
    r = await client.post(
        "/api/auth/register", json={"email": "Maria@Mail.ru", "password": "secret-pass-1"}
    )
    assert r.status_code == 202
    assert r.json() == {"email": "maria@mail.ru"}
    assert "session" not in r.cookies
    assert (await client.get("/api/auth/me")).status_code == 401

    msg = mail.outbox[-1]
    code = _code_from_mail()
    assert code in msg["Subject"]
    html = msg.get_body(("html",)).get_content()
    assert "envola" in html and "Подтвердите почту" in html

    # Без кода войти по паролю нельзя: снова уходит код.
    r = await client.post(
        "/api/auth/login", json={"email": "maria@mail.ru", "password": "secret-pass-1"}
    )
    assert r.status_code == 403 and r.json()["error"]["code"] == "email_unverified"
    assert (await client.get("/api/auth/me")).status_code == 401
    # Новый код отменяет прежний.
    r = await client.post("/api/auth/code", json={"email": "maria@mail.ru", "code": code})
    assert r.status_code == 400

    r = await client.post(
        "/api/auth/code", json={"email": "maria@mail.ru", "code": _code_from_mail()}
    )
    assert r.status_code == 200
    assert r.json()["created"] is True
    me = (await client.get("/api/auth/me")).json()
    assert me["email_verified"] is True and me["profile"]["is_published"] is False

    assert (await client.post("/api/auth/logout")).status_code == 200
    r = await client.post(
        "/api/auth/login", json={"email": "maria@mail.ru", "password": "secret-pass-1"}
    )
    assert r.status_code == 200
    assert (await client.get("/api/auth/me")).status_code == 200


async def test_wrong_code_attempts_are_limited(client):
    await client.post("/api/auth/register", json={"email": "a@a.ru", "password": "secret-pass-1"})
    code = _code_from_mail()
    wrong = "000000" if code != "000000" else "111111"
    for _ in range(5):
        r = await client.post("/api/auth/code", json={"email": "a@a.ru", "code": wrong})
        assert r.status_code == 400
    # Даже верный код после пяти ошибок не проходит — нужен новый.
    r = await client.post("/api/auth/code", json={"email": "a@a.ru", "code": code})
    assert r.status_code == 429
    r = await client.post("/api/auth/code/resend", json={"email": "a@a.ru"})
    assert r.status_code == 200
    r = await client.post("/api/auth/code", json={"email": "a@a.ru", "code": _code_from_mail()})
    assert r.status_code == 200


async def test_resend_does_not_reveal_users(client):
    r = await client.post("/api/auth/code/resend", json={"email": "ghost@nowhere.ru"})
    assert r.status_code == 200
    assert mail.outbox == []


async def test_unverified_signup_can_be_restarted(client):
    """Опечатка в пароле до подтверждения: повторная регистрация задаёт пароль заново."""
    await client.post("/api/auth/register", json={"email": "a@a.ru", "password": "first-pass-1"})
    r = await client.post(
        "/api/auth/register", json={"email": "a@a.ru", "password": "second-pass-2"}
    )
    assert r.status_code == 202
    await client.post("/api/auth/code", json={"email": "a@a.ru", "code": _code_from_mail()})
    await client.post("/api/auth/logout")
    r = await client.post("/api/auth/login", json={"email": "a@a.ru", "password": "second-pass-2"})
    assert r.status_code == 200


async def test_duplicate_email(client):
    await _signup(client)
    r = await client.post("/api/auth/register", json={"email": "a@a.ru", "password": "x-pass-123"})
    assert r.status_code == 409


async def test_wrong_password_and_unknown_user_same_message(client):
    await _signup(client)
    wrong = await client.post("/api/auth/login", json={"email": "a@a.ru", "password": "nope-nope"})
    unknown = await client.post(
        "/api/auth/login", json={"email": "x@x.ru", "password": "nope-nope"}
    )
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json()["error"]["message"] == unknown.json()["error"]["message"]


async def test_legacy_verification_link(make_user):
    """Ссылка из письма в настройках (для старых неподтверждённых аккаунтов) работает."""
    maria = await make_user("maria@mail.ru", verified=False)
    assert (await maria.post("/api/auth/resend-verification")).status_code == 200
    token = _token_from_mail()
    assert (await maria.post("/api/auth/verify-email", json={"token": token})).status_code == 200
    assert (await maria.get("/api/auth/me")).json()["email_verified"] is True
    # Токен одноразовый.
    assert (await maria.post("/api/auth/verify-email", json={"token": token})).status_code == 400


async def test_password_reset_by_code(client):
    await _signup(client)
    other = await client.post(
        "/api/auth/login", json={"email": "a@a.ru", "password": "secret-pass-1"}
    )
    assert other.status_code == 200
    await client.post("/api/auth/password/forgot", json={"email": "A@a.ru"})
    msg = mail.outbox[-1]
    code = _code_from_mail()
    assert "сброс" in msg["Subject"]
    r = await client.post(
        "/api/auth/password/reset-code",
        json={
            "email": "a@a.ru",
            "code": "000000" if code != "000000" else "111111",
            "password": "brand-new-pass",
        },
    )
    assert r.status_code == 400
    r = await client.post(
        "/api/auth/password/reset-code",
        json={"email": "a@a.ru", "code": code, "password": "brand-new-pass"},
    )
    assert r.status_code == 200
    # Старые сессии закрыты, новая — открыта сразу.
    sessions = (await client.get("/api/auth/sessions")).json()
    assert len(sessions) == 1
    await client.post("/api/auth/logout")
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
        await _signup(client)
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
    await _signup(client)
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


async def test_change_email_requires_confirmation_from_new_address(make_user, client):
    maria = await make_user("maria@mail.ru")
    await make_user("taken@mail.ru")
    body = {"new_email": "maria.new@mail.ru", "password": "secret-pass-1"}
    assert (
        await maria.post("/api/auth/change-email", json=body | {"password": "wrong"})
    ).status_code == 400
    r = await maria.post("/api/auth/change-email", json=body | {"new_email": "taken@mail.ru"})
    assert r.status_code == 409

    mail.outbox.clear()
    assert (await maria.post("/api/auth/change-email", json=body)).status_code == 200
    to = [m["To"] for m in mail.outbox]
    assert to == ["maria.new@mail.ru", "maria@mail.ru"]  # ссылка на новый, уведомление на старый
    token = _token_from_mail(0)

    # До подтверждения работает старый адрес.
    assert (await maria.get("/api/auth/me")).json()["email"] == "maria@mail.ru"
    r = await client.post(
        "/api/auth/login", json={"email": "maria@mail.ru", "password": "secret-pass-1"}
    )
    assert r.status_code == 200

    assert (await client.post("/api/auth/confirm-email", json={"token": token})).status_code == 200
    me = (await maria.get("/api/auth/me")).json()
    assert me["email"] == "maria.new@mail.ru" and me["email_verified"] is True
    r = await client.post(
        "/api/auth/login", json={"email": "maria.new@mail.ru", "password": "secret-pass-1"}
    )
    assert r.status_code == 200
    # Ссылка одноразовая.
    assert (await client.post("/api/auth/confirm-email", json={"token": token})).status_code == 400


async def test_change_password_logs_out_other_devices(make_user, client):
    maria = await make_user("maria@mail.ru")
    r = await client.post(
        "/api/auth/login", json={"email": "maria@mail.ru", "password": "secret-pass-1"}
    )
    assert r.status_code == 200
    r = await maria.post(
        "/api/auth/password/change",
        json={"current_password": "secret-pass-1", "new_password": "another-pass"},
    )
    assert r.status_code == 200
    assert (await maria.get("/api/auth/me")).status_code == 200  # текущее устройство остаётся
    assert (await client.get("/api/auth/me")).status_code == 401  # второе вышло


async def test_login_limited_per_ip_across_emails(client):
    s = get_settings()
    old = s.auth_rate_limit
    s.auth_rate_limit = 2
    try:
        codes = [
            (
                await client.post(
                    "/api/auth/login", json={"email": f"u{i}@a.ru", "password": "wrong-pass"}
                )
            ).status_code
            for i in range(9)
        ]
        assert codes[:8] == [401] * 8
        assert codes[8] == 429
    finally:
        s.auth_rate_limit = old


async def test_sessions_list_and_revoke_others(make_user, client):
    maria = await make_user("maria@mail.ru")
    other = await client.post(
        "/api/auth/login",
        json={"email": "maria@mail.ru", "password": "secret-pass-1"},
        headers={"User-Agent": "Mozilla/5.0 (iPhone) Safari"},
    )
    assert other.status_code == 200

    sessions = (await maria.get("/api/auth/sessions")).json()
    assert len(sessions) == 2
    assert [s["current"] for s in sessions].count(True) == 1
    assert any("iPhone" in s["user_agent"] for s in sessions)

    assert (await maria.post("/api/auth/sessions/revoke-others")).status_code == 200
    assert (await client.get("/api/auth/me")).status_code == 401
    left = (await maria.get("/api/auth/sessions")).json()
    assert len(left) == 1 and left[0]["current"]


async def test_revoke_session_only_own(make_user):
    maria = await make_user("maria@mail.ru")
    oleg = await make_user("oleg@mail.ru")
    maria_session = (await maria.get("/api/auth/sessions")).json()[0]["id"]
    # Чужую сессию удалить нельзя: запрос проходит, но ничего не меняет.
    assert (await oleg.delete(f"/api/auth/sessions/{maria_session}")).status_code == 200
    assert (await maria.get("/api/auth/me")).status_code == 200
    assert (await maria.delete(f"/api/auth/sessions/{maria_session}")).status_code == 200
    assert (await maria.get("/api/auth/me")).status_code == 401


async def test_old_sessions_are_pruned_on_login(make_user, client):
    from app.services.auth import MAX_SESSIONS

    await make_user("maria@mail.ru")
    for _ in range(MAX_SESSIONS + 5):
        r = await client.post(
            "/api/auth/login", json={"email": "maria@mail.ru", "password": "secret-pass-1"}
        )
        assert r.status_code == 200
    sessions = (await client.get("/api/auth/sessions")).json()
    assert len(sessions) == MAX_SESSIONS
    assert all(s["last_seen_at"] for s in sessions)
