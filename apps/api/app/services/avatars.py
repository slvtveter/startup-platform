"""Загрузка аватара (KAN-34): проверка, обрезка в квадрат, два размера, WebP без EXIF."""

import asyncio
import io
import secrets

from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models import Profile
from app.services.storage import get_storage

MAX_BYTES = 5 * 1024 * 1024
ALLOWED = {"JPEG", "PNG", "WEBP"}
# 1024 и 512 — крупные карточки на чётких экранах; у старых аватаров их может не быть.
SIZES = (1024, 512, 256, 64)
# Защита от «бомб»: картинка 10000×10000 из маленького файла разворачивается в гигабайты.
Image.MAX_IMAGE_PIXELS = 40_000_000


def _render(data: bytes) -> dict[int, bytes]:
    try:
        with Image.open(io.BytesIO(data)) as img:
            if img.format not in ALLOWED:
                raise AppError("Подойдёт JPEG, PNG или WebP")
            img.load()
            img = ImageOps.exif_transpose(img).convert("RGB")
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as exc:
        raise AppError("Это не похоже на изображение") from exc
    out = {}
    for size in SIZES:
        square = ImageOps.fit(img, (size, size), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        # Новое кодирование не переносит EXIF: геометки и данные камеры не попадут наружу.
        square.save(buf, "WEBP", quality=85)
        out[size] = buf.getvalue()
    return out


async def upload(db: AsyncSession, profile: Profile, data: bytes) -> None:
    if len(data) > MAX_BYTES:
        raise AppError("Файл больше 5 МБ")
    # Декодирование и ресайз — работа CPU: в потоке, чтобы не стоял весь api.
    images = await asyncio.to_thread(_render, data)
    storage = get_storage()
    old = profile.avatar_key
    # Новый ключ на каждую загрузку: браузеры и CDN не покажут старую картинку из кеша.
    key = f"avatars/{profile.id}-{secrets.token_hex(4)}"
    for size, blob in images.items():
        storage.save(f"{key}-{size}.webp", blob)
    profile.avatar_key = key
    await db.commit()
    if old:
        for size in SIZES:
            storage.delete(f"{old}-{size}.webp")


async def remove(db: AsyncSession, profile: Profile) -> None:
    old = profile.avatar_key
    profile.avatar_key = None
    await db.commit()
    if old:
        for size in SIZES:
            get_storage().delete(f"{old}-{size}.webp")
