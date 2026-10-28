"""Резюме в PDF: проверка, хранение вне публичной раздачи /media, выдача только вошедшим."""

import secrets
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError, NotFound
from app.models import Profile
from app.services.storage import get_storage

MAX_BYTES = 5 * 1024 * 1024


def _clean_name(name: str) -> str:
    """Имя файла для скачивания: без пути и управляющих символов, всегда .pdf."""
    stem = Path(name or "").name.removesuffix(".pdf").removesuffix(".PDF")
    stem = "".join(ch for ch in stem if ch.isprintable() and ch not in '"\\/').strip()
    return (stem[:150] or "Резюме") + ".pdf"


async def upload(db: AsyncSession, profile: Profile, data: bytes, filename: str) -> None:
    if len(data) > MAX_BYTES:
        raise AppError("Файл больше 5 МБ")
    if not data.startswith(b"%PDF-"):
        raise AppError("Подойдёт только PDF")
    storage = get_storage()
    old = profile.resume_key
    # Длинный случайный ключ: даже зная id профиля, путь к файлу не угадать.
    key = f"resumes/{profile.id}-{secrets.token_hex(16)}.pdf"
    storage.save(key, data)
    profile.resume_key = key
    profile.resume_name = _clean_name(filename)
    await db.commit()
    if old:
        storage.delete(old)


async def remove(db: AsyncSession, profile: Profile) -> None:
    old = profile.resume_key
    profile.resume_key = None
    profile.resume_name = ""
    await db.commit()
    if old:
        get_storage().delete(old)


def path_of(profile: Profile) -> Path:
    if not profile.resume_key:
        raise NotFound("Резюме не загружено")
    path = Path(get_settings().media_dir) / profile.resume_key
    if not path.is_file():
        raise NotFound("Резюме не загружено")
    return path
