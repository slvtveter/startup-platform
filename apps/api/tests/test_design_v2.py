"""Данные для редизайна: свободные места, часы роли, скорость ответа, события лендинга."""

from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import Event, User
from tests.test_applications import MESSAGE
from tests.test_startups import STARTUP, create_published


async def test_role_hours_and_outcome_in_card_and_detail(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    s = (await founder.post("/api/startups", json=STARTUP)).json()
    role = {
        "role": "designer",
        "title": "UI/UX дизайнер",
        "slots": 2,
        "hours_per_week": 8,
        "outcome": "Кейс в портфолио и рекомендация",
    }
    assert (await founder.post(f"/api/startups/{s['id']}/roles", json=role)).status_code == 201
    await founder.post(f"/api/startups/{s['id']}/publish")

    card = (await client.get("/api/startups")).json()["items"][0]
    assert card["team_size"] == 1
    assert card["open_roles"][0] | {"role": None} == {
        "id": card["open_roles"][0]["id"],
        "title": "UI/UX дизайнер",
        "role": None,
        "slots": 2,
        "hours_per_week": 8,
    }
    detail = (await client.get(f"/api/startups/{s['slug']}")).json()
    assert detail["roles"][0]["outcome"] == "Кейс в портфолио и рекомендация"
    assert detail["response_stats"] is None

    r = await founder.post(f"/api/startups/{s['id']}/roles", json=role | {"hours_per_week": 80})
    assert r.status_code == 422


async def test_open_seats_only_public_and_two_per_startup(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    for title in ("Backend-разработчик", "Маркетолог"):
        await founder.post(
            f"/api/startups/{s['id']}/roles",
            json={"role": "backend", "title": title, "skills": []},
        )
    # Черновик другого основателя на доску не попадает.
    other = await make_user("oleg@mail.ru", published=True)
    await other.post("/api/startups", json=STARTUP | {"title": "Черновик"})

    seats = (await client.get("/api/seats")).json()
    assert len(seats) == 2
    assert {seat["startup"]["slug"] for seat in seats} == {s["slug"]}

    await founder.post(f"/api/startups/{s['id']}/close")
    assert (await client.get("/api/seats")).json() == []


async def test_response_stats_after_three_applications(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    role_id = s["roles"][0]["id"]
    r = await founder.patch(f"/api/startup-roles/{role_id}", json={"slots": 4})
    assert r.status_code == 422  # не больше трёх мест на роль
    await founder.patch(f"/api/startup-roles/{role_id}", json={"slots": 3})
    apps = []
    for name in ("maria", "oleg", "ivan"):
        c = await make_user(f"{name}@mail.ru", published=True)
        r = await c.post(f"/api/startup-roles/{role_id}/applications", json={"message": MESSAGE})
        apps.append(r.json()["id"])

    stats = (await client.get(f"/api/startups/{s['slug']}")).json()["response_stats"]
    assert stats == {"answered_share": 0.0, "median_hours": None}

    await founder.post(f"/api/applications/{apps[0]}/accept", json={})
    stats = (await client.get(f"/api/startups/{s['slug']}")).json()["response_stats"]
    assert stats["answered_share"] == 0.33
    assert stats["median_hours"] is not None and stats["median_hours"] < 1


async def test_landing_path_event(client):
    r = await client.post("/api/events", json={"name": "landing_path_selected", "path": "seeker"})
    assert r.status_code == 201
    # Произвольные события с клиента не принимаются.
    r = await client.post("/api/events", json={"name": "signup", "path": "seeker"})
    assert r.status_code == 422
    async with SessionLocal() as db:
        event = await db.scalar(select(Event).where(Event.name == "landing_path_selected"))
    assert event is not None and event.props["path"] == "seeker"


async def test_e2e_cleanup_only_outside_prod(make_user, client, monkeypatch):
    await make_user("e2e-1@e2e.example.com", published=True)
    await make_user("real@mail.ru")
    assert (await client.post("/api/testing/cleanup-e2e")).status_code == 200
    async with SessionLocal() as db:
        emails = set(await db.scalars(select(User.email)))
    assert "real@mail.ru" in emails and "e2e-1@e2e.example.com" not in emails

    monkeypatch.setattr(get_settings(), "env", "prod")
    assert (await client.post("/api/testing/cleanup-e2e")).status_code == 404


async def test_client_events_dedup_rate_limit_and_no_ip(client, monkeypatch):
    ip = {"x-forwarded-for": "203.0.113.7"}
    for _ in range(100):
        r = await client.post("/api/events", json={"name": "landing_viewed"}, headers=ip)
        assert r.status_code == 201  # отброшенные отвечают так же, как принятые
    monkeypatch.setattr(get_settings(), "client_events_per_minute", 5)
    for _ in range(10):
        await client.post(
            "/api/events", json={"name": "landing_path_selected", "path": "founder"}, headers=ip
        )
    async with SessionLocal() as db:
        events = list(
            await db.scalars(
                select(Event).where(Event.name.in_(["landing_viewed", "landing_path_selected"]))
            )
        )
    names = [e.name for e in events]
    assert names.count("landing_viewed") == 1
    assert names.count("landing_path_selected") == 4  # лимит 5 в минуту, один уже занят просмотром
    for e in events:
        assert "203.0.113.7" not in str(e.props) and len(e.props["v"]) == 24


async def test_founder_sees_views_and_urls_stay_stable(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    for i in range(3):
        await client.post(
            "/api/events",
            json={"name": "startup_viewed", "slug": s["slug"]},
            headers={"x-forwarded-for": f"10.1.0.{i}"},
        )
    mine = (await founder.get("/api/me/startups")).json()
    assert mine[0]["views_30d"] == 3

    # Адреса не меняются при переименовании: ссылки в чатах и поиске не ломаются.
    await founder.patch(f"/api/startups/{s['id']}", json={"title": "Новое имя проекта"})
    assert (await client.get(f"/api/startups/{s['slug']}")).json()["title"] == "Новое имя проекта"
    me = (await founder.get("/api/profile/me")).json()
    await founder.patch("/api/profile/me", json={"display_name": "Алина Новая"})
    assert (await founder.get("/api/profile/me")).json()["slug"] == me["slug"]
