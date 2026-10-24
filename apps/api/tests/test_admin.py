from tests.test_startups import create_published


async def test_admin_requires_role(make_user):
    c = await make_user("user@mail.ru")
    assert (await c.get("/api/admin/metrics")).status_code == 403


async def test_metrics_and_moderation(make_user, client):
    admin = await make_user("admin@mail.ru", admin=True)
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)

    m = (await admin.get("/api/admin/metrics")).json()
    funnel = {step["name"]: step["count"] for step in m["funnel"]}
    assert funnel["signup"] == 2
    assert m["active_startups"] == 1

    r = await admin.post(f"/api/admin/startups/{s['id']}/hide")
    assert r.status_code == 200
    assert (await client.get("/api/startups")).json()["total"] == 0

    users = (await admin.get("/api/admin/users", params={"q": "alina"})).json()
    assert len(users) == 1
    await admin.post(f"/api/admin/users/{users[0]['id']}/block")
    assert (await founder.get("/api/auth/me")).status_code == 401

    audit = (await admin.get("/api/admin/audit")).json()
    assert {a["action"] for a in audit} == {"hide_startup", "block_user"}


async def test_reports_and_feedback(make_user, client):
    admin = await make_user("admin@mail.ru", admin=True)
    r = await client.post(
        "/api/reports", json={"target_type": "startup", "target_id": "x", "reason": "spam"}
    )
    assert r.status_code == 201
    assert (await client.post("/api/feedback", json={"text": "Классная идея"})).status_code == 201
    reports = (await admin.get("/api/admin/reports")).json()
    assert reports[0]["reason"] == "spam"
    await admin.post(f"/api/admin/reports/{reports[0]['id']}/resolve")
    assert (await admin.get("/api/admin/reports")).json() == []


async def test_public_stats(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    await create_published(founder)
    assert (await client.get("/api/stats")).json() == {
        "startups": 1,
        "people": 1,
        "open_roles": 1,
        "intros_30d": 0,
    }
