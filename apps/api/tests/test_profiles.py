async def test_profile_update_and_completeness(make_user):
    c = await make_user("maria@mail.ru")
    r = await c.patch(
        "/api/profile/me",
        json={
            "display_name": "Мария Ким",
            "primary_role": "designer",
            "skills": ["figma", "ux-research", "prototyping"],
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["slug"] == "mariya-kim"
    assert body["primary_role"]["slug"] == "designer"
    assert body["completeness"] == 50
    assert "Telegram для связи" in body["missing"]


async def test_unknown_skill_rejected(make_user):
    c = await make_user("maria@mail.ru")
    r = await c.patch("/api/profile/me", json={"skills": ["no-such-skill"]})
    assert r.status_code == 400


async def test_publish_requires_verified_email(make_user):
    c = await make_user("maria@mail.ru", verified=False)
    await c.patch(
        "/api/profile/me",
        json={
            "display_name": "Мария",
            "primary_role": "designer",
            "skills": ["figma"],
            "looking_for": ["free"],
        },
    )
    r = await c.post("/api/profile/me/publish", json={"published": True})
    assert r.status_code == 400
    assert "Подтвердите email" in r.json()["error"]["details"]


async def test_people_catalog_filters_and_privacy(make_user, client):
    await make_user("maria@mail.ru", published=True, name="Мария")
    await make_user("oleg@mail.ru", published=True, name="Олег", role="marketer", skills=("smm",))
    await make_user("hidden@mail.ru", published=False)

    r = await client.get("/api/people")
    assert r.json()["total"] == 2
    item = r.json()["items"][0]
    assert "contact_telegram" not in item and "email" not in item

    r = await client.get("/api/people", params={"role": "marketer"})
    assert [p["display_name"] for p in r.json()["items"]] == ["Олег"]
    r = await client.get("/api/people", params={"skill": "figma"})
    assert [p["display_name"] for p in r.json()["items"]] == ["Мария"]

    r = await client.get("/api/people/mariya")
    assert r.status_code == 200
    unpublished = await client.get("/api/people", params={"q": "hidden"})
    assert unpublished.json()["total"] == 0
