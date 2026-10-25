"""Демо-контент на проде: примеры стартапов и людей, пока нет настоящих (app.scripts.demo).

Демо-аккаунты узнаём по домену почты: .invalid зарезервирован (RFC 2606), письма туда не уходят.
На карточках пометка «Пример», откликнуться, пригласить или написать нельзя.
"""

from app.core.errors import AppError
from app.models import User

DEMO_EMAIL_DOMAIN = "demo.invalid"


def is_demo_email(email: str) -> bool:
    return email.lower().endswith("@" + DEMO_EMAIL_DOMAIN)


def is_demo(user: User) -> bool:
    return is_demo_email(user.email)


def ensure_not_demo(user: User) -> None:
    if is_demo(user):
        raise AppError("Это пример, чтобы показать, как выглядит платформа: связаться нельзя.")
