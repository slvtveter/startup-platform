STARTUP = {
    "title": "ВкусноРядом",
    "pitch": "Домашняя еда от соседей с доставкой",
    "description": "Люди, которые любят готовить, продают порции соседям. Делаем мобильное приложение.",
    "stage": "prototype",
    "terms": "negotiable",
}
ROLE = {"role": "designer", "title": "UI/UX дизайнер", "skills": ["figma"], "slots": 1}


async def create_published(c) -> dict:
    s = (await c.post("/api/startups", json=STARTUP)).json()
    await c.post(f"/api/startups/{s['id']}/roles", json=ROLE)
    r = await c.post(f"/api/startups/{s['id']}/publish")
    assert r.status_code == 200, r.text
    return r.json()


async def test_create_publish_flow(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    r = await founder.post("/api/startups", json=STARTUP)
    assert r.status_code == 201
    s = r.json()
    assert s["slug"] == "vkusnoryadom" and s["status"] == "draft"

    # Черновик не виден посторонним и не попадает в ленту.
    assert (await client.get(f"/api/startups/{s['slug']}")).status_code == 404
    r = await founder.post(f"/api/startups/{s['id']}/publish")
    assert r.status_code == 400
    assert "Откройте хотя бы одну роль" in r.json()["error"]["details"]

    await founder.post(f"/api/startups/{s['id']}/roles", json=ROLE)
    r = await founder.post(f"/api/startups/{s['id']}/publish")
    assert r.json()["status"] == "recruiting"

    feed = (await client.get("/api/startups")).json()
    assert feed["total"] == 1
    assert feed["items"][0]["open_roles"][0]["title"] == "UI/UX дизайнер"
    detail = (await client.get("/api/startups/vkusnoryadom")).json()
    assert detail["team"][0]["role_title"] == "Основатель"
    assert detail["is_owner"] is False


async def test_feed_filters(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    await create_published(founder)
    assert (await client.get("/api/startups", params={"role": "designer"})).json()["total"] == 1
    assert (await client.get("/api/startups", params={"role": "backend"})).json()["total"] == 0
    assert (await client.get("/api/startups", params={"terms": "paid"})).json()["total"] == 0
    assert (await client.get("/api/startups", params={"skill": "figma"})).json()["total"] == 1
    assert (await client.get("/api/startups", params={"q": "соседям"})).json()["total"] == 1


async def test_only_owner_can_edit(make_user):
    founder = await make_user("alina@mail.ru", published=True)
    other = await make_user("oleg@mail.ru", published=True)
    s = await create_published(founder)
    r = await other.patch(f"/api/startups/{s['id']}", json={"title": "Взлом"})
    assert r.status_code == 403
    r = await founder.patch(f"/api/startups/{s['id']}", json={"pitch": "Новая формулировка идеи"})
    assert r.json()["pitch"] == "Новая формулировка идеи"


async def test_active_startups_limit(make_user):
    founder = await make_user("alina@mail.ru")
    for i in range(3):
        assert (
            await founder.post("/api/startups", json={**STARTUP, "title": f"Проект {i}"})
        ).status_code == 201
    assert (await founder.post("/api/startups", json=STARTUP)).status_code == 400


async def test_recommendations(make_user):
    founder = await make_user("alina@mail.ru", published=True)
    await create_published(founder)
    maria = await make_user("maria@mail.ru", published=True)
    recs = (await maria.get("/api/me/recommended-startups")).json()
    assert recs[0]["startup"]["slug"] == "vkusnoryadom"
    assert recs[0]["score"] > 0


async def test_facets_count_each_filter_without_itself(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    await create_published(founder)
    other = await make_user("oleg@mail.ru", published=True)
    s = (
        await other.post(
            "/api/startups", json={**STARTUP, "title": "Идея", "stage": "idea", "terms": "free"}
        )
    ).json()
    await other.post(
        f"/api/startups/{s['id']}/roles", json={**ROLE, "role": "backend", "title": "Бэкенд"}
    )
    await other.post(f"/api/startups/{s['id']}/publish")

    f = (await client.get("/api/startups/facets")).json()
    assert f == {
        "stage": {"prototype": 1, "idea": 1},
        "terms": {"negotiable": 1, "free": 1},
        "role": {"designer": 1, "backend": 1},
    }
    # Выбранная стадия сужает роли и оплату, но числа у других стадий остаются.
    f = (await client.get("/api/startups/facets", params={"stage": "idea"})).json()
    assert f["stage"] == {"prototype": 1, "idea": 1}
    assert f["role"] == {"backend": 1} and f["terms"] == {"free": 1}
    f = (
        await client.get("/api/startups/facets", params={"q": "соседям", "role": "designer"})
    ).json()
    assert f["stage"] == {"prototype": 1}


async def test_reserved_slugs(make_user):
    founder = await make_user("alina@mail.ru")
    for title in ("New", "Facets"):
        s = (await founder.post("/api/startups", json={**STARTUP, "title": title})).json()
        assert s["slug"] not in ("new", "facets") and s["slug"].startswith(title.lower())


async def test_owner_deletes_startup_with_applications(make_user, client):
    founder = await make_user("del-owner@mail.ru", published=True)
    other = await make_user("del-other@mail.ru", published=True)
    s = await create_published(founder)
    r = await other.post(
        f"/api/startup-roles/{s['roles'][0]['id']}/applications",
        json={"message": "Привет! Хочу помочь с проектом, есть опыт в учебных кейсах."},
    )
    assert r.status_code in (200, 201), r.text

    assert (await other.delete(f"/api/startups/{s['id']}")).status_code in (403, 404)
    assert (await founder.delete(f"/api/startups/{s['id']}")).status_code == 200
    assert (await client.get(f"/api/startups/{s['slug']}")).status_code == 404
    assert (await other.get("/api/me/applications")).json() == []
