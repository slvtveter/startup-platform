"""Напоминания основателям об откликах без ответа больше 48 часов. Запускать по cron раз в сутки."""

import asyncio

from app.db.session import SessionLocal
from app.services.applications import remind_stale


async def main() -> None:
    async with SessionLocal() as db:
        print(f"reminders sent: {await remind_stale(db)}")


if __name__ == "__main__":
    asyncio.run(main())
