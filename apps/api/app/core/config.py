from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "local"
    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/app"

    # Публичный адрес сайта: из него строятся ссылки в письмах.
    site_url: str = "http://localhost:8080"
    # Вход через соцсети: пусто — кнопка не показывается. Токен бота от @BotFather (домен бота
    # задаётся там же командой /setdomain), client_id приложения VK ID (id.vk.com/business).
    telegram_bot_token: str = ""
    vk_client_id: str = ""
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
    mail_from: str = "Envola <noreply@envola.ru>"

    # Rate limiting для auth-эндпоинтов: столько попыток за окно.
    auth_rate_limit: int = 5
    auth_rate_window_minutes: int = 15

    # Загруженные файлы (аватары): локальный каталог, в docker — volume, который раздаёт Caddy.
    media_dir: str = "media"

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
