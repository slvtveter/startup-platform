import hashlib
import secrets

from pwdlib import PasswordHash

_hasher = PasswordHash.recommended()  # argon2id


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _hasher.verify(password, password_hash)


def new_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    # В БД храним только хеш: утечка таблицы не даёт рабочих токенов.
    return hashlib.sha256(token.encode()).hexdigest()
