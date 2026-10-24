"""KAN-107: еженедельная подборка новых ролей под профиль."""

from app.db.session import SessionLocal
from app.services import digest, mail
from tests.test_startups import ROLE, STARTUP


async def _publish(founder, roles: list[dict]) -> None:
    s = (await founder.post("/api/startups", json=STARTUP)).json()
    for r in roles:
        await founder.post(f"/api/startups/{s['id']}/roles", json=r)
    assert (await founder.post(f"/api/startups/{s['id']}/publish")).status_code == 200


async def _run() -> int:
    async with SessionLocal() as db:
        return await digest.send_weekly(db)


def _to(email: str) -> list:
    return [m for m in mail.outbox if m["To"] == email]


async def test_digest_matches_role_and_is_sent_once_a_week(make_user):
    founder = await make_user("alina@mail.ru", published=True, role="backend", skills=("python",))
    await make_user("maria@mail.ru", published=True)  # дизайнер: figma, ux-research
    await make_user("oleg@mail.ru", published=True, role="marketer", skills=("smm",))
    backend = {"role": "backend", "title": "Python-разработчик", "skills": ["python"], "slots": 1}
    await _publish(founder, [ROLE, backend])
    mail.outbox.clear()

    assert await _run() == 1
    [msg] = _to("maria@mail.ru")
    body = msg.get_body(("plain",)).get_content()
    assert "UI/UX дизайнер" in body and "Python-разработчик" not in body
    assert "?src=digest" in body and msg["List-Unsubscribe"]
    # Маркетологу подходящих ролей нет, основателю свои роли не шлём.
    assert not _to("oleg@mail.ru") and not _to("alina@mail.ru")

    mail.outbox.clear()
    assert await _run() == 0 and not mail.outbox


async def test_digest_unsubscribe_keeps_other_mail(make_user):
    founder = await make_user("alina@mail.ru", published=True, role="backend", skills=("python",))
    maria = await make_user("maria@mail.ru", published=True)
    r = await maria.put("/api/me/email-prefs", json={"prefs": {"digest": False}})
    prefs = {p["kind"]: p["enabled"] for p in r.json()}
    assert prefs["digest"] is False and prefs["decisions"] is True

    await _publish(founder, [ROLE])
    mail.outbox.clear()
    assert await _run() == 0 and not _to("maria@mail.ru")


async def test_digest_click_is_tracked(client):
    r = await client.post(
        "/api/events", json={"name": "startup_viewed", "slug": "vkusnoryadom", "src": "digest"}
    )
    assert r.status_code == 201
    bad = await client.post("/api/events", json={"name": "startup_viewed", "src": "spam"})
    assert bad.status_code == 422
