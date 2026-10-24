"""Доставка событий чата в открытые WebSocket (KAN-127).

Каждый процесс api слушает канал Postgres `chat` (LISTEN) и пересылает событие
тем своим соединениям, чьи пользователи участвуют в диалоге. Так работают несколько
процессов и воркер без отдельного брокера: Postgres уже есть.
"""

import asyncio
import json
import logging
from collections import defaultdict

import asyncpg
from fastapi import WebSocket

from app.core.config import get_settings

logger = logging.getLogger("app.chat")


class Hub:
    def __init__(self) -> None:
        self.sockets: dict[str, set[WebSocket]] = defaultdict(set)
        self._conn: asyncpg.Connection | None = None
        self._lock = asyncio.Lock()

    async def ensure_listening(self) -> None:
        """Подписаться на канал при первом подключении (и после обрыва соединения с БД)."""
        async with self._lock:
            if self._conn is not None and not self._conn.is_closed():
                return
            dsn = get_settings().database_url.replace("postgresql+asyncpg://", "postgresql://")
            self._conn = await asyncpg.connect(dsn)
            await self._conn.add_listener("chat", self._on_notify)
            logger.info("chat hub listening")

    def _on_notify(self, _conn, _pid, _channel, payload: str) -> None:
        event = json.loads(payload)
        message = {"type": "message", "conversation_id": event["conversation_id"]}
        for user_id in event["users"]:
            for ws in list(self.sockets.get(user_id, ())):
                asyncio.create_task(self._send(user_id, ws, message))

    async def _send(self, user_id: str, ws: WebSocket, message: dict) -> None:
        try:
            await ws.send_json(message)
        except Exception:
            self.sockets[user_id].discard(ws)

    def add(self, user_id: str, ws: WebSocket) -> None:
        self.sockets[user_id].add(ws)

    def remove(self, user_id: str, ws: WebSocket) -> None:
        self.sockets[user_id].discard(ws)
        if not self.sockets[user_id]:
            self.sockets.pop(user_id, None)


hub = Hub()
