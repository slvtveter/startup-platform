"""Обратная связь «Сообщить о проблеме»: текст и необязательный скриншот.

Скриншот перекодируем в WebP (заодно отрезаются метаданные и всё, что не картинка) и кладём в
private/feedback/: Caddy отдаёт на /media/private/* 404, смотреть можно только из админки.
"""

import asyncio
import io
import secrets
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError
from app.models import Feedback, User
from app.services.storage import get_storage

MAX_BYTES = 5 * 1024 * 1024
MAX_SIDE = 1920


def _render(data: bytes) -> bytes:
    try:
        with Image.open(io.BytesIO(data)) as img:
            img = ImageOps.exif_transpose(img)
            img.thumbnail((MAX_SIDE, MAX_SIDE))
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            out = io.BytesIO()
            img.save(out, "WEBP", quality=82)
            return out.getvalue()
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as exc:
        raise AppError("Скриншот должен быть картинкой: PNG, JPEG или WebP") from exc


async def create(
    db: AsyncSession, user: User | None, text: str, page_url: str, screenshot: bytes | None
) -> Feedback:
    fb = Feedback(user_id=user.id if user else None, text=text, page_url=page_url)
    if screenshot:
        if len(screenshot) > MAX_BYTES:
            raise AppError("Скриншот больше 5 МБ")
        webp = await asyncio.to_thread(_render, screenshot)
        key = f"private/feedback/{secrets.token_hex(16)}.webp"
        get_storage().save(key, webp)
        fb.screenshot_key = key
    db.add(fb)
    await db.commit()
    return fb


def screenshot_path(fb: Feedback) -> Path | None:
    if not fb.screenshot_key:
        return None
    return Path(get_settings().media_dir) / fb.screenshot_key
