"""KAN-74: настройки писем, отписка без входа, HTML-версия писем."""

import re
from urllib.parse import parse_qs, urlparse

from app.services import mail
from tests.test_applications import MESSAGE
from tests.test_startups import create_published


def _parts(msg) -> tuple[str, str]:
    text = msg.get_body(("plain",)).get_content()
    html = msg.get_body(("html",)).get_content()
    return text, html


async def _apply(founder, applicant) -> None:
    s = await create_published(founder)
    r = await applicant.post(
        f"/api/startup-roles/{s['roles'][0]['id']}/applications", json={"message": MESSAGE}
    )
    assert r.status_code == 201


async def test_notification_has_html_and_unsubscribe_works_without_login(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    maria = await make_user("maria@mail.ru", published=True)
    mail.outbox.clear()
    await _apply(founder, maria)

    msg = next(m for m in mail.outbox if m["To"] == "alina@mail.ru")
    text, html = _parts(msg)
    assert "Отписаться от таких писем" in text and "startup.platform" in html
    assert "<script" not in html and "<img" not in html
    url = re.search(r"(http\S+/unsubscribe\?\S+)", text).group(1)
    assert msg["List-Unsubscribe"] == f"<{url}>"
    q = {k: v[0] for k, v in parse_qs(urlparse(url).query).items()}

    # Подделанная подпись и чужой тип не принимаются.
    assert (
        await client.post("/api/email/unsubscribe", json=q | {"t": "0" * 32})
    ).status_code == 400
    assert (
        await client.post("/api/email/unsubscribe", json=q | {"k": "decisions"})
    ).status_code == 400
    # Без входа, повторно — без ошибок.
    for _ in range(2):
        r = await client.post("/api/email/unsubscribe", json=q)
        assert r.status_code == 200 and r.json()["label"] == "Новые отклики на мои стартапы"

    prefs = {p["kind"]: p["enabled"] for p in (await founder.get("/api/me/email-prefs")).json()}
    assert prefs == {"applications": False, "decisions": True, "invites": True, "reminders": True}

    # Следующий отклик основателю уже не пишем.
    mail.outbox.clear()
    oleg = await make_user("oleg@mail.ru", published=True)
    role_id = (await founder.get("/api/me/startups")).json()[0]["open_roles"][0]["id"]
    await founder.patch(f"/api/startup-roles/{role_id}", json={"slots": 3})
    r = await oleg.post(f"/api/startup-roles/{role_id}/applications", json={"message": MESSAGE})
    assert r.status_code == 201
    assert not [m for m in mail.outbox if m["To"] == "alina@mail.ru"]


async def test_email_prefs_update_and_service_mail_has_no_unsubscribe(make_user, client):
    maria = await make_user("maria@mail.ru")
    r = await maria.put("/api/me/email-prefs", json={"prefs": {"reminders": False}})
    assert {p["kind"]: p["enabled"] for p in r.json()}["reminders"] is False
    assert (
        await maria.put("/api/me/email-prefs", json={"prefs": {"spam": True}})
    ).status_code == 400
    assert (await client.get("/api/me/email-prefs")).status_code == 401

    mail.outbox.clear()
    await client.post(
        "/api/auth/register", json={"email": "new@mail.ru", "password": "secret-pass-1"}
    )
    text, html = _parts(mail.outbox[-1])
    assert "Отписаться" not in text and "служебное письмо" in html
