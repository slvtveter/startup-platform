"""Тесты гоняются на отдельной БД app_test: dev-данные не трогаем.

Схема создаётся настоящими миграциями (alembic upgrade head) один раз за сессию,
после каждого теста все таблицы очищаются TRUNCATE.
"""

import asyncio
import os
import subprocess
import sys
from collections.abc import AsyncIterator, Awaitable, Callable
from pathlib import Path

_base_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://app:app@localhost:5432/app")
TEST_DB_URL = _base_url.rsplit("/", 1)[0] + "/app_test"
os.environ.update(
    DATABASE_URL=TEST_DB_URL,
    ENV="test",
    MAIL_BACKEND="memory",
    AUTH_RATE_LIMIT="1000",
)

import asyncpg  # noqa: E402
import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text, update  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Role, Skill, User  # noqa: E402
from app.services import mail  # noqa: E402

API_DIR = Path(__file__).resolve().parents[1]


def _create_test_db() -> None:
    dsn = TEST_DB_URL.replace("postgresql+asyncpg", "postgresql")
    admin_dsn = dsn.rsplit("/", 1)[0] + "/postgres"

    async def run() -> None:
        conn = await asyncpg.connect(admin_dsn)
        try:
            exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'app_test'")
            if not exists:
                await conn.execute("CREATE DATABASE app_test")
        finally:
            await conn.close()

    asyncio.run(run())


@pytest.fixture(scope="session", autouse=True)
def database() -> None:
    _create_test_db()
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=API_DIR,
        check=True,
        env=os.environ,
    )


@pytest.fixture(autouse=True)
async def clean_db() -> AsyncIterator[None]:
    mail.outbox.clear()
    yield
    tables = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
    async with SessionLocal() as db:
        await db.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
        await db.commit()


@pytest.fixture
async def catalog() -> None:
    async with SessionLocal() as db:
        db.add_all(
            [
                Role(slug="designer", name="Дизайнер", sort=1),
                Role(slug="backend", name="Backend", sort=2),
                Role(slug="marketer", name="Маркетолог", sort=3),
                Skill(slug="figma", name="Figma", category="design"),
                Skill(slug="ux-research", name="UX-исследования", category="design"),
                Skill(slug="prototyping", name="Прототипирование", category="design"),
                Skill(slug="python", name="Python", category="dev"),
                Skill(slug="smm", name="SMM", category="marketing"),
            ]
        )
        await db.commit()


def _new_client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async with _new_client() as c:
        yield c


MakeUser = Callable[..., Awaitable[AsyncClient]]


@pytest.fixture
async def make_user(catalog) -> AsyncIterator[MakeUser]:
    """Фабрика: зарегистрированный (и по желанию готовый к работе) пользователь со своим клиентом."""
    clients: list[AsyncClient] = []

    async def factory(
        email: str,
        verified: bool = True,
        published: bool = False,
        admin: bool = False,
        name: str | None = None,
        role: str = "designer",
        skills: tuple[str, ...] = ("figma", "ux-research"),
    ) -> AsyncClient:
        c = _new_client()
        clients.append(c)
        r = await c.post("/api/auth/register", json={"email": email, "password": "secret-pass-1"})
        assert r.status_code == 201, r.text
        values: dict = {}
        if verified:
            values["email_verified_at"] = text("now()")
        if admin:
            values["is_admin"] = True
        if values:
            async with SessionLocal() as db:
                await db.execute(update(User).where(User.email == email).values(**values))
                await db.commit()
        if published:
            r = await c.patch(
                "/api/profile/me",
                json={
                    "display_name": name or email.split("@")[0].title(),
                    "headline": "Ищу первый проект в команде",
                    "primary_role": role,
                    "skills": list(skills),
                    "looking_for": ["free", "equity"],
                    "contact_telegram": "@" + email.split("@")[0],
                },
            )
            assert r.status_code == 200, r.text
            r = await c.post("/api/profile/me/publish", json={"published": True})
            assert r.status_code == 200, r.text
        return c

    yield factory
    for c in clients:
        await c.aclose()
