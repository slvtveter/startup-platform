from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "local"
    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/app"

    # Публичный адрес сайта: из него строятся ссылки в письмах.
    site_url: str = "http://localhost:8080"
    # Разрешённые Origin для изменяющих запросов (защита от CSRF).
    allowed_origins: list[str] = ["http://localhost:8080", "http://localhost:3000"]

    session_cookie_name: str = "session"
    session_ttl_days: int = 30

    # smtp — реальная отправка (локально в Mailpit), memory — для тестов.
    mail_backend: str = "smtp"
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    mail_from: str = "Startup Platform <noreply@startup-platform.local>"

    # Rate limiting для auth-эндпоинтов: столько попыток за окно.
    auth_rate_limit: int = 5
    auth_rate_window_minutes: int = 15

    # Подпись ссылок отписки в письмах. В prod обязателен свой (openssl rand -hex 32).
    secret_key: str = "dev-secret-change-me"

    # Соль для хеша посетителя в клиентских событиях (дедупликация без хранения IP).
    # Пусто — случайная соль на процесс: дедупликация работает, но сбрасывается при рестарте.
    events_salt: str = ""
    client_events_per_minute: int = 60

    @model_validator(mode="after")
    def _prod_secret(self) -> "Settings":
        if self.env not in ("local", "test") and self.secret_key == "dev-secret-change-me":
            raise ValueError("SECRET_KEY должен быть задан вне local/test")
        return self

    @property
    def cookie_secure(self) -> bool:
        return self.env not in ("local", "test")


@lru_cache
def get_settings() -> Settings:
    return Settings()
