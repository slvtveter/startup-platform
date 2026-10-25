"""Примеры на пустом проде: видны с пометкой, связаться с ними нельзя, удаляются одной командой."""

import pytest

from app.core.config import get_settings
from app.scripts import catalog, demo
from tests.test_applications import MESSAGE
from tests.test_startups import create_published


@pytest.fixture
def media(tmp_path, monkeypatch):
    monkeypatch.setattr(get_settings(), "media_dir", str(tmp_path))
    return tmp_path


async def test_demo_is_marked_and_unreachable(make_user, client, media):
    await demo.add()
    await demo.add()  # повторный запуск ничего не дублирует

    startups = (await client.get("/api/startups")).json()
    assert startups["total"] == 3
    assert all(s["is_demo"] for s in startups["items"])
    people = (await client.get("/api/people")).json()
    assert people["total"] == 7
    assert all(p["is_demo"] and p["avatar_url"] for p in people["items"])
    assert len(list(media.rglob("*.webp"))) == 14  # 7 аватарок × 2 размера
    # Счётчики на лендинге — только настоящие, места на доске помечены.
    stats = (await client.get("/api/stats")).json()
    assert stats["startups"] == stats["people"] == stats["open_roles"] == 0
    seats = (await client.get("/api/seats")).json()
    assert seats and all(s["startup"]["is_demo"] for s in seats)

    maria = await make_user("maria@mail.ru", published=True)
    detail = (await client.get(f"/api/startups/{startups['items'][0]['slug']}")).json()
    r = await maria.post(
        f"/api/startup-roles/{detail['roles'][0]['id']}/applications", json={"message": MESSAGE}
    )
    assert r.status_code == 400 and "пример" in r.json()["error"]["message"]

    seeker = next(p for p in people["items"] if p["slug"] == "kirill-morozov")
    r = await maria.post("/api/chats", json={"slug": seeker["slug"], "body": "Привет!"})
    assert r.status_code == 400

    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    r = await founder.post(
        f"/api/people/{seeker['slug']}/invite",
        json={"startup_role_id": s["roles"][0]["id"], "message": MESSAGE},
    )
    assert r.status_code == 400

    # Настоящие карточки без пометки.
    real = next(x for x in (await client.get("/api/startups")).json()["items"] if not x["is_demo"])
    assert real["slug"] == s["slug"]

    await demo.remove()
    assert (await client.get("/api/startups")).json()["total"] == 1
    assert (await client.get("/api/people")).json()["total"] == 2
    assert not list(media.rglob("*.webp"))


async def test_catalog_is_idempotent(client):
    await catalog.main()
    await catalog.main()
    roles = (await client.get("/api/roles")).json()
    assert len(roles) == len(catalog.ROLES)
