from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    # Две отдельные галочки в форме: без них аккаунт не создаётся.
    accept_terms: Literal[True]
    adult: Literal[True]
    utm_source: str | None = Field(default=None, max_length=64)

    @field_validator("email")
    @classmethod
    def normalize(cls, v: str) -> str:
        return v.strip().lower()


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize(cls, v: str) -> str:
        return v.strip().lower()


class CodeIn(BaseModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")

    @field_validator("email")
    @classmethod
    def normalize(cls, v: str) -> str:
        return v.strip().lower()


class ResendCodeIn(BaseModel):
    email: EmailStr
    purpose: Literal["verify", "reset"] = "verify"

    @field_validator("email")
    @classmethod
    def normalize(cls, v: str) -> str:
        return v.strip().lower()


class ResetCodeIn(BaseModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize(cls, v: str) -> str:
        return v.strip().lower()


class CodeSentOut(BaseModel):
    """Код ушёл на почту: дальше шаг ввода кода."""

    email: str


class TokenIn(BaseModel):
    token: str = Field(min_length=10, max_length=200)


class ForgotIn(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize(cls, v: str) -> str:
        return v.strip().lower()


class ResetIn(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    password: str = Field(min_length=8, max_length=128)


class ChangeEmailIn(BaseModel):
    new_email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class MeProfile(BaseModel):
    slug: str
    display_name: str
    is_published: bool
    completeness: int
    avatar_url: str | None = None


class SessionOut(BaseModel):
    id: str
    created_at: datetime
    last_seen_at: datetime | None = None
    user_agent: str
    current: bool


class MeOut(BaseModel):
    id: str
    email: str
    is_admin: bool
    email_verified: bool
    # Нет согласия с действующей редакцией соглашения: показываем экран согласия.
    needs_terms: bool
    profile: MeProfile | None


class TermsIn(BaseModel):
    accept_terms: Literal[True]
    adult: Literal[True]


class SocialProvidersOut(BaseModel):
    telegram: bool
    vk: bool
    telegram_bot_id: str | None = None


class TelegramAuthIn(BaseModel):
    """Данные из oauth.telegram.org как есть: подпись проверяется по всем полям."""

    id: int
    first_name: str = ""
    last_name: str = ""
    username: str = ""
    photo_url: str = ""
    auth_date: int
    hash: str


class SignInOut(BaseModel):
    """Вход кодом из письма или через Telegram/VK: created — аккаунт только что создан."""

    me: "MeOut"
    created: bool
