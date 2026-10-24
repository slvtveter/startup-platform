"""Воркер фоновых задач (KAN-91): `python -m app.worker`.

Разбирает очередь jobs, раз в час отправляет напоминания основателям
об откликах без ответа, а по понедельникам — подборку новых ролей (KAN-107).
"""

import asyncio
import logging
import signal
from datetime import UTC, datetime, timedelta

from app.core.logging import setup_logging
from app.db.session import SessionLocal
from app.services import jobs, mail  # noqa: F401 — mail регистрирует обработчик send_mail
from app.services.applications import remind_stale
from app.services.digest import send_weekly

logger = logging.getLogger("app.worker")

POLL_SECONDS = 2
REMIND_EVERY = timedelta(hours=1)


async def main() -> None:
    setup_logging()
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)
    next_remind = datetime.now(UTC)
    logger.info("worker started")
    while not stop.is_set():
        try:
            async with SessionLocal() as db:
                if datetime.now(UTC) >= next_remind:
                    sent = await remind_stale(db)
                    logger.info(f"reminders sent: {sent}")
                    # Подборка по понедельникам; повторный вызов в ту же неделю ничего не шлёт.
                    if datetime.now(UTC).weekday() == 0:
                        logger.info(f"digests sent: {await send_weekly(db)}")
                    next_remind = datetime.now(UTC) + REMIND_EVERY
                while not stop.is_set() and await jobs.run_once(db):
                    pass
        except Exception:
            logger.exception("worker iteration failed")
        try:
            await asyncio.wait_for(stop.wait(), timeout=POLL_SECONDS)
        except TimeoutError:
            pass
    logger.info("worker stopped")


if __name__ == "__main__":
    asyncio.run(main())
