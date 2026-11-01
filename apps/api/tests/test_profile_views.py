"""Просмотры профиля за 30 дней: владелец видит, сколько раз его открывали (profile_viewed)."""


async def test_profile_views_are_counted_once_per_visitor(make_user, client):
    owner = await make_user("seen@b.ru", published=True)
    slug = (await owner.get("/api/profile/me")).json()["slug"]
    assert (await owner.get("/api/profile/me")).json()["views_30d"] == 0

    for _ in range(3):  # повторные открытия одним посетителем считаются один раз
        r = await client.post("/api/events", json={"name": "profile_viewed", "slug": slug})
        assert r.status_code == 201, r.text
    assert (await owner.get("/api/profile/me")).json()["views_30d"] == 1
