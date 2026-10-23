from tests.test_startups import create_published

MESSAGE = "Здравствуйте! Хочу поработать над экранами заказа, есть кейс в портфолио."


async def test_apply_accept_exchanges_contacts(make_user):
    founder = await make_user("alina@mail.ru", published=True, name="Алина")
    s = await create_published(founder)
    role_id = s["roles"][0]["id"]
    maria = await make_user("maria@mail.ru", published=True, name="Мария")

    r = await maria.post(f"/api/startup-roles/{role_id}/applications", json={"message": MESSAGE})
    assert r.status_code == 201
    app = r.json()
    assert app["status"] == "pending" and app["contacts"] is None and app["can_withdraw"]

    # Повторный отклик на ту же роль запрещён.
    r = await maria.post(f"/api/startup-roles/{role_id}/applications", json={"message": MESSAGE})
    assert r.status_code == 409

    incoming = (await founder.get(f"/api/startups/{s['id']}/applications")).json()
    assert incoming[0]["applicant"]["display_name"] == "Мария"
    assert incoming[0]["can_decide"] is True
    # Кандидат не может сам себя принять.
    assert (await maria.post(f"/api/applications/{app['id']}/accept", json={})).status_code == 403

    r = await founder.post(f"/api/applications/{app['id']}/accept", json={})
    assert r.status_code == 200
    assert r.json()["contacts"]["telegram"] == "maria"

    mine = (await maria.get("/api/me/applications")).json()
    assert mine[0]["status"] == "accepted"
    assert mine[0]["contacts"]["email"] == "alina@mail.ru"

    detail = (await founder.get(f"/api/startups/{s['slug']}")).json()
    assert detail["roles"][0]["is_open"] is False  # единственное место занято
    assert [m["display_name"] for m in detail["team"]] == ["Алина", "Мария"]


async def test_cannot_apply_without_published_profile_or_to_own(make_user):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    role_id = s["roles"][0]["id"]
    draft = await make_user("draft@mail.ru")
    r = await draft.post(f"/api/startup-roles/{role_id}/applications", json={"message": MESSAGE})
    assert r.status_code == 400
    r = await founder.post(f"/api/startup-roles/{role_id}/applications", json={"message": MESSAGE})
    assert r.status_code == 400


async def test_reject_and_withdraw(make_user):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    role_id = s["roles"][0]["id"]
    maria = await make_user("maria@mail.ru", published=True)
    app = (
        await maria.post(f"/api/startup-roles/{role_id}/applications", json={"message": MESSAGE})
    ).json()
    r = await founder.post(
        f"/api/applications/{app['id']}/reject", json={"note": "Нужен опыт в EdTech"}
    )
    assert r.json()["status"] == "rejected"
    # После отказа можно откликнуться снова и отозвать отклик.
    app2 = (
        await maria.post(f"/api/startup-roles/{role_id}/applications", json={"message": MESSAGE})
    ).json()
    r = await maria.post(f"/api/applications/{app2['id']}/withdraw")
    assert r.json()["status"] == "withdrawn"


async def test_invite_flow(make_user):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    role_id = s["roles"][0]["id"]
    maria = await make_user("maria@mail.ru", published=True, name="Мария")
    r = await founder.post(
        "/api/people/mariya/invite", json={"startup_role_id": role_id, "message": "Зовём к нам!"}
    )
    assert r.status_code == 201
    invite = r.json()
    assert invite["direction"] == "invite" and invite["can_decide"] is False

    mine = (await maria.get("/api/me/applications")).json()
    assert mine[0]["can_decide"] is True
    r = await maria.post(f"/api/applications/{invite['id']}/accept", json={})
    assert r.json()["contacts"]["email"] == "alina@mail.ru"


async def test_contacts_never_leak_in_public_endpoints(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    await create_published(founder)
    await make_user("maria@mail.ru", published=True)
    for path in ("/api/startups", "/api/startups/vkusnoryadom", "/api/people", "/api/people/maria"):
        text = (await client.get(path)).text
        assert "@mail.ru" not in text, path
