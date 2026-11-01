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


async def test_hypotheses_panel(make_user, client):
    admin = await make_user("admin@mail.ru", admin=True)
    # Разные посетители: одинаковые просмотры с одного IP схлопываются (KAN-95).
    for i in range(4):
        await client.post(
            "/api/events",
            json={"name": "landing_viewed"},
            headers={"x-forwarded-for": f"10.0.0.{i}"},
        )
    await client.post("/api/events", json={"name": "landing_path_selected", "path": "seeker"})
    await client.post("/api/events", json={"name": "startup_viewed", "slug": "vkusnoryadom"})
    assert (
        await client.post("/api/events", json={"name": "startup_viewed", "slug": "Bad slug!"})
    ).status_code == 422

    rows = {r["key"]: r for r in (await admin.get("/api/admin/hypotheses?days=30")).json()}
    assert list(rows) == [f"H{i}" for i in range(1, 9)]
    assert rows["H2"]["current"] == 0.25 and rows["H2"]["previous"] is None
    # Регистрация админа в тесте тоже signup: 1 из 4 просмотров.
    assert rows["H1"]["current"] == 0.25
    # Откликов не было: «нет данных», а не ноль.
    assert rows["H4"]["current"] is None and rows["H8"]["current"] is None
    assert (await client.get("/api/admin/hypotheses")).status_code == 401


async def test_cohort_retention_and_csv_export(make_user):
    from datetime import UTC, datetime, timedelta

    from app.db.session import SessionLocal
    from app.models import Event, User
    from app.services import retention

    admin = await make_user("admin@mail.ru", admin=True)
    now = datetime(2026, 10, 24, 12, tzinfo=UTC)
    week_ago = now - timedelta(days=30)  # когорта дозрела до D7
    async with SessionLocal() as db:
        people = [User(email=f"cohort{i}@mail.ru") for i in range(4)]
        db.add_all(people)
        await db.flush()
        users = [u.id for u in people]
        for uid in users:
            db.add(Event(name="signup", user_id=uid, created_at=week_ago, props={}))
        # Двое вернулись на 8-й день, один — только на 2-й (не считается).
        for uid in users[:2]:
            db.add(
                Event(
                    name="application_sent",
                    user_id=uid,
                    created_at=week_ago + timedelta(days=8),
                    props={},
                )
            )
        db.add(
            Event(
                name="application_sent",
                user_id=users[2],
                created_at=week_ago + timedelta(days=2),
                props={},
            )
        )
        await db.commit()
        rows = await retention.cohorts(db, weeks=8, now=now)
    cohort = next(r for r in rows if r.signups == 4)
    assert cohort.d7 == 0.5 and cohort.d30 is None  # D30 ещё не дозрел

    r = await admin.get("/api/admin/export?kind=funnel&days=30")
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    assert r.text.startswith("﻿шаг,событие,")
    assert "attachment" in r.headers["content-disposition"]
    r = await admin.get("/api/admin/export?kind=cohorts")
    assert r.text.splitlines()[0] == "﻿неделя регистрации,регистраций,D7,D30"


async def test_admin_totals_and_feedback_list(make_user, client):
    admin = await make_user("boss@mail.ru", admin=True)
    member = await make_user("fan@mail.ru", published=True)
    await member.post("/api/feedback", json={"text": "Не нашёл кнопку отклика", "page_url": "/x"})
    await client.post("/api/feedback", json={"text": "Гость тоже пишет"})

    t = (await admin.get("/api/admin/totals")).json()
    assert t["users"] == 2 and t["users_new"] == 2
    assert t["profiles_published"] == 1 and t["feedback_new"] == 2

    rows = (await admin.get("/api/admin/feedback")).json()
    assert [r["text"] for r in rows] == ["Гость тоже пишет", "Не нашёл кнопку отклика"]
    assert rows[1]["user_email"] == "fan@mail.ru" and rows[0]["user_email"] is None

    assert (await member.get("/api/admin/feedback")).status_code == 403


async def test_admin_overview_excludes_demo_and_e2e(make_user):
    admin = await make_user("ov-admin@mail.ru", admin=True)
    await make_user("real-one@mail.ru", published=True)
    await _demo(make_user, "sample@mail.ru", "sample@demo.invalid")
    await make_user("bot@e2e.example.com")

    o = (await admin.get("/api/admin/overview", params={"days": 14})).json()
    assert o["totals"]["users"] == 2  # админ и настоящий, без демо и E2E
    assert o["totals"]["demo_users"] == 1
    assert len(o["signups"]) == 14 and sum(d["count"] for d in o["signups"]) == 2
    assert {u["email"] for u in o["recent"]} == {"ov-admin@mail.ru", "real-one@mail.ru"}

    demo = (await admin.get("/api/admin/users", params={"kind": "demo"})).json()
    assert [u["email"] for u in demo] == ["sample@demo.invalid"] and demo[0]["is_demo"]
    real = {
        u["email"] for u in (await admin.get("/api/admin/users", params={"kind": "real"})).json()
    }
    assert real == {"ov-admin@mail.ru", "real-one@mail.ru"}


async def test_admin_deletes_user_but_not_admin(make_user, client):
    admin = await make_user("del-admin@mail.ru", admin=True)
    victim = await _demo(make_user, "victim@mail.ru", "victim@demo.invalid")
    users = (await admin.get("/api/admin/users", params={"q": "victim"})).json()
    assert (await admin.delete(f"/api/admin/users/{users[0]['id']}")).status_code == 200
    assert (await victim.get("/api/auth/me")).status_code == 401
    assert (await admin.get("/api/admin/users", params={"q": "victim"})).json() == []
    me = (await admin.get("/api/admin/users", params={"q": "del-admin"})).json()[0]
    assert (await admin.delete(f"/api/admin/users/{me['id']}")).status_code == 403
    actions = {a["action"] for a in (await admin.get("/api/admin/audit")).json()}
    assert "delete_user" in actions


async def _demo(make_user, email: str, demo_email: str):
    """Демо-аккаунт: через API такой адрес не зарегистрировать, поэтому меняем почту в базе."""
    from sqlalchemy import update

    from app.db.session import SessionLocal
    from app.models import User

    c = await make_user(email, published=True)
    async with SessionLocal() as db:
        await db.execute(update(User).where(User.email == email).values(email=demo_email))
        await db.commit()
    return c
