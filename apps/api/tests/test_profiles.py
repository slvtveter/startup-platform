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
    assert body["completeness"] == 45  # имя 10 + роль 15 + навыки 20
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


PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


async def test_resume_upload_is_private(make_user, client):
    maria = await make_user("maria@mail.ru", published=True, name="Мария Ким")
    slug = (await maria.get("/api/profile/me")).json()["slug"]

    r = await maria.post(
        "/api/profile/me/resume", files={"file": ("cv.png", b"\x89PNG....", "image/png")}
    )
    assert r.status_code == 400
    r = await maria.post(
        "/api/profile/me/resume",
        files={"file": ("../Мария Ким CV.pdf", PDF, "application/pdf")},
    )
    assert r.status_code == 200, r.text
    me = r.json()
    assert me["resume_name"] == "Мария Ким CV.pdf"
    assert "Портфолио или резюме" not in me["missing"]

    person = (await client.get(f"/api/people/{slug}")).json()
    assert person["has_resume"] is True and "resume_name" not in person
    # Гостю файл не отдаём, вошедшему — да.
    assert (await client.get(f"/api/people/{slug}/resume")).status_code == 401
    oleg = await make_user("oleg@mail.ru")
    r = await oleg.get(f"/api/people/{slug}/resume")
    assert r.status_code == 200
    assert r.content == PDF and r.headers["content-type"] == "application/pdf"
    assert "no-store" in r.headers["cache-control"]

    assert (await maria.delete("/api/profile/me/resume")).json()["resume_name"] == ""
    assert (await oleg.get(f"/api/people/{slug}/resume")).status_code == 404


async def test_people_sort_by_experience(make_user, client):
    newbie = await make_user("newbie@a.ru", published=True, name="Новичок")
    await newbie.patch("/api/profile/me", json={"experience_level": "no_experience"})
    junior = await make_user("junior@a.ru", published=True, name="Джун")
    await junior.patch("/api/profile/me", json={"experience_level": "junior"})
    # Новичок обновлён последним — по умолчанию (новые) он первый.
    await newbie.patch("/api/profile/me", json={"city": "Казань"})
    names = lambda r: [p["display_name"] for p in r.json()["items"]]  # noqa: E731
    assert names(await client.get("/api/people"))[:2] == ["Новичок", "Джун"]
    assert names(await client.get("/api/people?sort=experience"))[:2] == ["Джун", "Новичок"]
    assert (await client.get("/api/people?sort=nope")).status_code == 422
