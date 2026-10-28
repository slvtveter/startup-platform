"""Вход через Telegram и VK ID."""

import hashlib
import hmac
import time

import pytest

from app.core.config import get_settings

TOKEN = "123456:test-bot-token"


@pytest.fixture
def telegram(monkeypatch):
    monkeypatch.setattr(get_settings(), "telegram_bot_token", TOKEN)


def _signed(**fields) -> dict:
    data = {"id": 42, "first_name": "Ева", "auth_date": int(time.time()), **fields}
    check = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret = hashlib.sha256(TOKEN.encode()).digest()
    data["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return data


async def test_providers_hidden_without_config(client):
    assert (await client.get("/api/auth/providers")).json() == {
        "telegram": False,
        "vk": False,
        "telegram_bot_id": None,
    }


async def test_telegram_login_creates_then_reuses_account(telegram, client):
    assert (await client.get("/api/auth/providers")).json()["telegram_bot_id"] == "123456"
    r = await client.post("/api/auth/telegram", json=_signed())
    assert r.status_code == 200, r.text
    assert r.json()["created"] is True
    me = (await client.get("/api/auth/me")).json()
    assert me["email"].endswith("@users.invalid")
    # Повторный вход тем же аккаунтом — тот же пользователь.
    r = await client.post("/api/auth/telegram", json=_signed())
    assert r.json()["created"] is False and r.json()["me"]["id"] == me["id"]


async def test_telegram_rejects_bad_signature_and_old_data(telegram, client):
    bad = _signed() | {"first_name": "Подмена"}
    assert (await client.post("/api/auth/telegram", json=bad)).status_code == 400
    old = _signed(auth_date=int(time.time()) - 3 * 86400)
    assert (await client.post("/api/auth/telegram", json=old)).status_code == 400


async def test_vk_start_redirects_with_pkce(monkeypatch, client):
    monkeypatch.setattr(get_settings(), "vk_client_id", "5555")
    r = await client.get("/api/auth/vk/start", follow_redirects=False)
    assert r.status_code == 307
    assert r.headers["location"].startswith("https://id.vk.com/authorize?")
    assert "code_challenge_method=S256" in r.headers["location"]
    # Ответ без нашего state не принимаем.
    r = await client.get("/api/auth/vk/callback?code=x&state=forged", follow_redirects=False)
    assert r.headers["location"] == "/login?error=vk"
