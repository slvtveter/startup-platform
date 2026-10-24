"""KAN-104: полнотекстовый поиск с русской морфологией и ранжированием."""

from tests.test_startups import ROLE, STARTUP, create_published


async def _titles(client, q: str, path: str = "/api/startups") -> list[str]:
    r = await client.get(path, params={"q": q})
    assert r.status_code == 200, r.text
    key = "title" if path == "/api/startups" else "display_name"
    return [i[key] for i in r.json()["items"]]


async def test_startup_search_understands_word_forms(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    await create_published(founder)

    # «доставку» в запросе, «с доставкой» в питче; «дизайнеры» — открытая роль «UI/UX дизайнер».
    assert await _titles(client, "доставку") == ["ВкусноРядом"]
    assert await _titles(client, "дизайнеры") == ["ВкусноРядом"]
    assert await _titles(client, "бухгалтерия") == []
    # Короткий запрос — префикс названия, без стемминга.
    assert await _titles(client, "Вк") == ["ВкусноРядом"]
    assert await _titles(client, "ус") == []


async def test_title_match_ranks_above_description_match(make_user, client):
    founder = await make_user("alina@mail.ru", published=True)
    for title, description in [
        ("Соседи", "Маркетплейс домашней еды: соседи продают порции друг другу через приложение."),
        ("Маркетплейс репетиторов", "Студенты находят преподавателей рядом с домом и занимаются."),
    ]:
        s = (
            await founder.post(
                "/api/startups", json=STARTUP | {"title": title, "description": description}
            )
        ).json()
        await founder.post(f"/api/startups/{s['id']}/roles", json=ROLE)
        assert (await founder.post(f"/api/startups/{s['id']}/publish")).status_code == 200

    assert await _titles(client, "маркетплейсы") == ["Маркетплейс репетиторов", "Соседи"]


async def test_people_search_by_role_and_text(make_user, client):
    await make_user("maria@mail.ru", published=True, name="Мария Ким")
    await make_user("oleg@mail.ru", published=True, name="Олег", role="backend")

    assert await _titles(client, "дизайнеры", "/api/people") == ["Мария Ким"]
    assert await _titles(client, "Ол", "/api/people") == ["Олег"]
