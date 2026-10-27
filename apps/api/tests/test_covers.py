"""Обложка стартапа и крупный аватар для карточек людей."""

import io
from pathlib import Path

import pytest
from PIL import Image

from app.core.config import get_settings
from tests.test_startups import create_published


@pytest.fixture
def media(tmp_path, monkeypatch) -> Path:
    monkeypatch.setattr(get_settings(), "media_dir", str(tmp_path))
    return tmp_path


def _jpeg(w: int = 1200, h: int = 900) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), (91, 140, 240)).save(buf, "JPEG")
    return buf.getvalue()


async def test_cover_upload_shows_in_feed_and_only_owner_can_change(make_user, client, media):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    assert s["cover_url"] is None

    r = await founder.post(
        f"/api/startups/{s['id']}/cover", files={"file": ("c.jpg", _jpeg(), "image/jpeg")}
    )
    assert r.status_code == 200, r.text
    url, url_lg = r.json()["cover_url"], r.json()["cover_url_lg"]
    assert url.startswith("/media/covers/") and url.endswith("-800.webp")
    with Image.open(media / url.removeprefix("/media/")) as img:
        assert img.size == (800, 450) and img.format == "WEBP"
    with Image.open(media / url_lg.removeprefix("/media/")) as img:
        assert img.size == (1600, 900)

    feed = (await client.get("/api/startups")).json()["items"][0]
    assert feed["cover_url"] == url

    stranger = await make_user("ivan@mail.ru")
    r = await stranger.post(
        f"/api/startups/{s['id']}/cover", files={"file": ("c.jpg", _jpeg(), "image/jpeg")}
    )
    assert r.status_code in (403, 404)

    # Новая загрузка — новый адрес, старые файлы удалены; удаление убирает всё.
    r = await founder.post(
        f"/api/startups/{s['id']}/cover", files={"file": ("c.jpg", _jpeg(640, 480), "image/jpeg")}
    )
    assert r.json()["cover_url"] != url and len(list(media.rglob("*.webp"))) == 2
    r = await founder.delete(f"/api/startups/{s['id']}/cover")
    assert r.json()["cover_url"] is None and not any(media.rglob("*.webp"))


async def test_cover_rejects_non_images(make_user, media):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    r = await founder.post(
        f"/api/startups/{s['id']}/cover", files={"file": ("x.jpg", b"nope", "image/jpeg")}
    )
    assert r.status_code == 400


async def test_large_avatar_and_cofound_filter(make_user, client, media):
    maria = await make_user("maria@mail.ru", published=True)
    r = await maria.post(
        "/api/profile/me/avatar", files={"file": ("me.jpg", _jpeg(900, 900), "image/jpeg")}
    )
    lg = r.json()["avatar_url_lg"]
    assert lg.endswith("-512.webp")
    with Image.open(media / lg.removeprefix("/media/")) as img:
        assert img.size == (512, 512)

    # «Ищу сообщников» — отдельное значение в looking_for, по нему фильтруется каталог.
    r = await maria.patch("/api/profile/me", json={"looking_for": ["free", "cofound"]})
    assert r.status_code == 200 and r.json()["looking_for"] == ["free", "cofound"]
    await make_user("ivan@mail.ru", published=True)
    found = (await client.get("/api/people", params={"looking_for": "cofound"})).json()
    assert [p["display_name"] for p in found["items"]] == ["Maria"]
    assert (
        await maria.patch("/api/profile/me", json={"looking_for": ["equity"]})
    ).status_code == 422
