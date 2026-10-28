"""KAN-75: справочники в админке и перенос стартапа на платформу за основателя."""

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import AdminAction
from tests.test_auth import _code_from_mail
from tests.test_startups import ROLE, STARTUP, create_published

PLATFORM_STARTUP = STARTUP | {"title": "Чужой проект", "owner_email": "Founder@Mail.ru"}


async def test_catalog_create_rename_merge_keeps_links(make_user, client):
    admin = await make_user("admin@mail.ru", admin=True)
    founder = await make_user("alina@mail.ru", published=True, skills=("figma", "ux-research"))
    s = await create_published(founder)  # роль designer со скиллом figma

    assert (
        await admin.post("/api/admin/catalog/skills", json={"name": "Figma Design"})
    ).status_code == 201
    assert (
        await admin.post("/api/admin/catalog/skills", json={"name": "Figma Design"})
    ).status_code == 409
    assert (
        await admin.patch("/api/admin/catalog/roles/designer", json={"name": "UI/UX дизайнер"})
    ).status_code == 200
    roles = {r["slug"]: r["name"] for r in (await client.get("/api/roles")).json()}
    assert roles["designer"] == "UI/UX дизайнер"

    # «Фигма» транслитерируется в тот же slug, что «figma», — это дубль.
    r = await admin.post("/api/admin/catalog/skills", json={"name": "Фигма"})
    assert r.status_code == 409
    # Сливаем «figma» в «figma-design»: связи профиля и роли стартапа переезжают.
    new_slug = next(
        x["slug"] for x in (await client.get("/api/skills")).json() if x["name"] == "Figma Design"
    )
    r = await admin.post("/api/admin/catalog/skills/figma/merge", json={"into": new_slug})
    assert r.status_code == 200
    detail = (await client.get(f"/api/startups/{s['slug']}")).json()
    assert [sk["slug"] for sk in detail["roles"][0]["skills"]] == [new_slug]
    me = (await founder.get("/api/profile/me")).json()
    assert sorted(sk["slug"] for sk in me["skills"]) == sorted([new_slug, "ux-research"])

    # Роль сливается вместе с профилями и ролями стартапов.
    r = await admin.post("/api/admin/catalog/roles/designer/merge", json={"into": "marketer"})
    assert r.status_code == 200
    detail = (await client.get(f"/api/startups/{s['slug']}")).json()
    assert detail["roles"][0]["role"]["slug"] == "marketer"
    assert (
        await admin.post("/api/admin/catalog/roles/marketer/merge", json={"into": "marketer"})
    ).status_code == 400
    assert (
        await founder.post("/api/admin/catalog/skills", json={"name": "Хак"})
    ).status_code == 403

    async with SessionLocal() as db:
        actions = list(await db.scalars(select(AdminAction.action)))
    assert {"catalog_create", "catalog_rename", "catalog_merge"} <= set(actions)


async def test_platform_startup_goes_to_owner_after_email_verification(make_user, client):
    admin = await make_user("admin@mail.ru", admin=True)
    r = await admin.post("/api/admin/startups", json=PLATFORM_STARTUP)
    assert r.status_code == 201
    s = r.json()
    assert s["is_owner"] is True  # пока владелец — админ
    await admin.post(f"/api/startups/{s['id']}/roles", json=ROLE)
    assert (await admin.post(f"/api/startups/{s['id']}/publish")).status_code == 200

    # Основатель регистрируется: до подтверждения почты права не переходят.
    founder = client
    await founder.post(
        "/api/auth/register", json={"email": "founder@mail.ru", "password": "secret-pass-1"}
    )
    assert (await founder.get(f"/api/startups/{s['slug']}")).json()["is_owner"] is False
    r = await founder.post(
        "/api/auth/code", json={"email": "founder@mail.ru", "code": _code_from_mail()}
    )
    assert r.status_code == 200

    detail = (await founder.get(f"/api/startups/{s['slug']}")).json()
    assert detail["is_owner"] is True
    mine = (await founder.get("/api/me/startups")).json()
    assert [m["slug"] for m in mine] == [s["slug"]]
    assert (await admin.get(f"/api/startups/{s['slug']}")).json()["is_owner"] is False


async def test_platform_startup_for_existing_verified_user(make_user):
    admin = await make_user("admin@mail.ru", admin=True)
    founder = await make_user("founder@mail.ru")
    r = await admin.post("/api/admin/startups", json=PLATFORM_STARTUP)
    assert r.json()["is_owner"] is False
    assert len((await founder.get("/api/me/startups")).json()) == 1


async def test_every_catalog_role_has_a_template(make_user, client):
    admin = await make_user("admin@mail.ru", admin=True)
    # Роль, которую добавил админ, тоже получает пример (общий шаблон).
    await admin.post("/api/admin/catalog/roles", json={"name": "Юрист"})
    roles = {r["slug"] for r in (await client.get("/api/roles")).json()}
    templates = {t["role"]: t for t in (await client.get("/api/role-templates")).json()}
    assert set(templates) == roles
    assert templates["designer"]["title"] == "UI/UX дизайнер"
    assert templates["designer"]["hours_per_week"] == 8
    assert set(templates["yurist"]["outcome"]) == {"free", "paid", "negotiable"}
    assert templates["yurist"]["title"] == "Юрист" and templates["yurist"]["description"]
