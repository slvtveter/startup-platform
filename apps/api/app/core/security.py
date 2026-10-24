import asyncio
import hashlib
import secrets

from pwdlib import PasswordHash

_hasher = PasswordHash.recommended()  # argon2id


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _hasher.verify(password, password_hash)


# argon2 тратит ~64 МБ и десятки миллисекунд CPU на хеш. Считаем в потоке, чтобы вход не
# останавливал event loop, и не больше двух сразу: всплеск логинов не съест память контейнера.
_slots = asyncio.Semaphore(2)
# Хеш для несуществующего email: проверка занимает столько же, и по времени ответа
# нельзя узнать, зарегистрирован ли адрес.
_DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


async def hash_password_async(password: str) -> str:
    async with _slots:
        return await asyncio.to_thread(hash_password, password)


async def check_password(password: str, password_hash: str | None) -> bool:
    async with _slots:
        ok = await asyncio.to_thread(verify_password, password, password_hash or _DUMMY_HASH)
    return ok and password_hash is not None


def new_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    # В БД храним только хеш: утечка таблицы не даёт рабочих токенов.
    return hashlib.sha256(token.encode()).hexdigest()
