"""KAN-127: личные сообщения, отклик — первое сообщение в диалоге."""

from tests.test_applications import MESSAGE
from tests.test_startups import create_published


async def test_application_opens_chat_with_cover_letter(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    maria = await make_user("maria@mail.ru", published=True, name="Мария Ким")
    r = await maria.post(
        f"/api/startup-roles/{s['roles'][0]['id']}/applications", json={"message": MESSAGE}
    )
    app_id = r.json()["id"]

    [chat] = (await founder.get("/api/chats")).json()["items"]
    assert chat["peer"]["display_name"] == "Мария Ким" and chat["unread"] == 1
    assert (await founder.get("/api/chats/unread")).json() == {"count": 1}
    [cover] = (await founder.get(f"/api/chats/{chat['id']}/messages")).json()
    assert cover["body"] == MESSAGE and not cover["mine"]
    assert cover["application"]["role_title"] == "UI/UX дизайнер"
    # Из карточки отклика обе стороны попадают в тот же диалог.
    for c in (founder, maria):
        r = await c.get(f"/api/chats/by-application/{app_id}")
        assert r.json()["id"] == chat["id"]

    # Основатель отвечает: у кандидата одно непрочитанное, у основателя прочитано.
    r = await founder.post(
        f"/api/chats/{chat['id']}/messages", json={"body": "Привет! Когда удобно созвониться?"}
    )
    assert r.status_code == 201 and r.json()["mine"]
    assert (await founder.get("/api/chats/unread")).json() == {"count": 0}
    assert (await maria.get("/api/chats/unread")).json() == {"count": 1}
    await maria.post(f"/api/chats/{chat['id']}/read")
    assert (await maria.get("/api/chats/unread")).json() == {"count": 0}

    # Посторонний диалог не видит.
    oleg = await make_user("oleg@mail.ru", published=True)
    assert (await oleg.get(f"/api/chats/{chat['id']}/messages")).status_code == 404
    assert (await client.get("/api/chats")).status_code == 401


async def test_write_to_anyone_from_people(make_user):
    maria = await make_user("maria@mail.ru", published=True)
    oleg = await make_user("oleg@mail.ru", published=True, name="Олег")
    slug = (await oleg.get("/api/profile/me")).json()["slug"]

    r = await maria.post(
        "/api/chats", json={"slug": slug, "body": "Привет! Давай что-нибудь сделаем?"}
    )
    assert r.status_code == 201
    again = await maria.post("/api/chats", json={"slug": slug, "body": "Ещё одна мысль"})
    assert again.json()["id"] == r.json()["id"]  # один диалог на пару
    [chat] = (await oleg.get("/api/chats")).json()["items"]
    assert chat["unread"] == 2 and chat["last_message"]["body"] == "Ещё одна мысль"

    me = (await maria.get("/api/profile/me")).json()["slug"]
    assert (await maria.post("/api/chats", json={"slug": me, "body": "я"})).status_code == 400


async def test_unverified_cannot_start_chats(make_user):
    await make_user("oleg@mail.ru", published=True)
    newbie = await make_user("new@mail.ru", verified=False)
    r = await newbie.post("/api/chats", json={"slug": "oleg", "body": "Привет"})
    assert r.status_code == 403


async def test_message_flood_is_limited(make_user, monkeypatch):
    from app.services import chat as chat_service

    monkeypatch.setattr(chat_service, "MESSAGES_PER_MINUTE", 2)
    maria = await make_user("maria@mail.ru", published=True)
    alina = await make_user("alina@mail.ru", published=True)
    slug = (await alina.get("/api/profile/me")).json()["slug"]
    conv = (await maria.post("/api/chats", json={"slug": slug, "body": "Привет!"})).json()["id"]
    assert (
        await maria.post(f"/api/chats/{conv}/messages", json={"body": "ещё"})
    ).status_code == 201
    r = await maria.post(f"/api/chats/{conv}/messages", json={"body": "и ещё"})
    assert r.status_code == 429
    # Повторный «Написать» из каталога тоже упирается в лимит.
    r = await maria.post("/api/chats", json={"slug": slug, "body": "обход"})
    assert r.status_code == 429
