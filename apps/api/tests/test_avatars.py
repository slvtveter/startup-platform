"""KAN-34: загрузка аватара."""

import io
from pathlib import Path

import pytest
from PIL import Image

from app.core.config import get_settings


@pytest.fixture
def media(tmp_path, monkeypatch) -> Path:
    monkeypatch.setattr(get_settings(), "media_dir", str(tmp_path))
    return tmp_path


def _jpeg_with_gps(w: int = 800, h: int = 600) -> bytes:
    img = Image.new("RGB", (w, h), (61, 61, 245))
    exif = Image.Exif()
    exif[0x8825] = {2: (55.0, 45.0, 0.0)}  # GPSInfo: координаты, которые нельзя публиковать
    buf = io.BytesIO()
    img.save(buf, "JPEG", exif=exif)
    return buf.getvalue()


async def test_avatar_upload_resizes_strips_exif_and_shows_in_catalog(make_user, client, media):
    maria = await make_user("maria@mail.ru", published=True)
    r = await maria.post(
        "/api/profile/me/avatar", files={"file": ("me.jpg", _jpeg_with_gps(), "image/jpeg")}
    )
    assert r.status_code == 200, r.text
    url = r.json()["avatar_url"]
    assert url.startswith("/media/avatars/") and url.endswith("-256.webp")

    big = media / url.removeprefix("/media/")
    small = Path(str(big).replace("-256.webp", "-64.webp"))
    with Image.open(big) as img:
        assert img.size == (256, 256) and img.format == "WEBP"
        assert not img.getexif()
    with Image.open(small) as img:
        assert img.size == (64, 64)

    card = (await client.get("/api/people")).json()["items"][0]
    assert card["avatar_url"] == url

    # Повторная загрузка заменяет файлы, удаление убирает их с диска.
    r = await maria.post(
        "/api/profile/me/avatar", files={"file": ("me.jpg", _jpeg_with_gps(300, 300), "image/jpeg")}
    )
    assert r.json()["avatar_url"] != url and not big.exists()
    r = await maria.delete("/api/profile/me/avatar")
    assert r.json()["avatar_url"] is None
    assert not any(media.rglob("*.webp"))


async def test_avatar_rejects_non_images_and_large_files(make_user, media):
    maria = await make_user("maria@mail.ru")
    r = await maria.post(
        "/api/profile/me/avatar", files={"file": ("x.jpg", b"<?php echo 1; ?>", "image/jpeg")}
    )
    assert r.status_code == 400 and "изображение" in r.json()["error"]["message"]
    gif = io.BytesIO()
    Image.new("RGB", (10, 10)).save(gif, "GIF")
    r = await maria.post(
        "/api/profile/me/avatar", files={"file": ("x.gif", gif.getvalue(), "image/gif")}
    )
    assert r.status_code == 400
    r = await maria.post(
        "/api/profile/me/avatar",
        files={"file": ("x.jpg", b"0" * (5 * 1024 * 1024 + 10), "image/jpeg")},
    )
    assert r.status_code == 400 and "5 МБ" in r.json()["error"]["message"]
