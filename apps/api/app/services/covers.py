"""Обложка стартапа: фото 16:9 в двух размерах, WebP без EXIF."""

import asyncio
import io
import secrets

from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models import Startup
from app.services.avatars import ALLOWED, MAX_BYTES
from app.services.storage import get_storage

WIDTHS = (1600, 800)
RATIO = 16 / 9


def cover_urls(s: Startup) -> tuple[str | None, str | None]:
    if not s.cover_key:
        return None, None
    return f"/media/{s.cover_key}-800.webp", f"/media/{s.cover_key}-1600.webp"


def render(data: bytes) -> dict[int, bytes]:
    try:
        with Image.open(io.BytesIO(data)) as img:
            if img.format not in ALLOWED:
                raise AppError("Подойдёт JPEG, PNG или WebP")
            img.load()
            img = ImageOps.exif_transpose(img).convert("RGB")
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as exc:
        raise AppError("Это не похоже на изображение") from exc
    out = {}
    for w in WIDTHS:
        frame = ImageOps.fit(img, (w, round(w / RATIO)), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        # Новое кодирование не переносит EXIF: геометки и данные камеры не попадут наружу.
        frame.save(buf, "WEBP", quality=82)
        out[w] = buf.getvalue()
    return out


def save(s: Startup, images: dict[int, bytes]) -> str | None:
    """Записать файлы под новым ключом, вернуть старый ключ (его файлы удаляют после commit)."""
    storage = get_storage()
    # Новый ключ на каждую загрузку: браузеры и CDN не покажут старую картинку из кеша.
    key = f"covers/{s.id}-{secrets.token_hex(4)}"
    for w, blob in images.items():
        storage.save(f"{key}-{w}.webp", blob)
    old, s.cover_key = s.cover_key, key
    return old


def drop(key: str | None) -> None:
    if key:
        for w in WIDTHS:
            get_storage().delete(f"{key}-{w}.webp")


async def upload(db: AsyncSession, s: Startup, data: bytes) -> None:
    if len(data) > MAX_BYTES:
        raise AppError("Файл больше 5 МБ")
    images = await asyncio.to_thread(render, data)
    old = save(s, images)
    await db.commit()
    drop(old)


async def remove(db: AsyncSession, s: Startup) -> None:
    old, s.cover_key = s.cover_key, None
    await db.commit()
    drop(old)
