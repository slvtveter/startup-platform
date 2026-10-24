"""KAN-91: очередь фоновых задач в Postgres и отправка писем через неё."""

import asyncio
import time
from datetime import UTC, datetime

from sqlalchemy import select, update

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import Job
from app.services import jobs, mail
from tests.test_applications import MESSAGE
from tests.test_startups import create_published

calls: list[int] = []


@jobs.handler("test_slow")
async def _slow(payload: dict) -> None:
    calls.append(payload["n"])
    await asyncio.sleep(0.2)


@jobs.handler("test_broken")
async def _broken(payload: dict) -> None:
    raise ConnectionError("smtp is down")


async def _due_now() -> None:
    async with SessionLocal() as db:
        await db.execute(update(Job).values(run_at=datetime.now(UTC)))
        await db.commit()


async def test_application_is_instant_when_smtp_is_down(make_user, monkeypatch):
    founder = await make_user("alina@mail.ru", published=True)
    s = await create_published(founder)
    maria = await make_user("maria@mail.ru", published=True)

    # Настоящий SMTP на закрытом порту: раньше отклик ждал таймаута соединения.
    settings = get_settings()
    monkeypatch.setattr(settings, "mail_backend", "smtp")
    monkeypatch.setattr(settings, "smtp_host", "127.0.0.1")
    monkeypatch.setattr(settings, "smtp_port", 1)
    started = time.monotonic()
    r = await maria.post(
        f"/api/startup-roles/{s['roles'][0]['id']}/applications", json={"message": MESSAGE}
    )
    assert r.status_code == 201
    assert time.monotonic() - started < 1

    async with SessionLocal() as db:
        job = await db.scalar(select(Job).where(Job.kind == "send_mail"))
        assert job.payload["to"] == "alina@mail.ru"
        assert await jobs.run_once(db) is True
        await db.refresh(job)
        assert job.attempts == 1 and job.done_at is None and "Error" in job.last_error

    # SMTP вернулся: письмо уходит при следующей попытке.
    sent: list = []
    monkeypatch.setattr(mail, "_send_smtp", sent.append)
    await _due_now()
    async with SessionLocal() as db:
        assert await jobs.run_once(db) is True
        job = await db.scalar(select(Job).where(Job.kind == "send_mail"))
        assert job.done_at is not None and not job.failed
    assert sent[0]["To"] == "alina@mail.ru"


async def test_two_workers_never_take_the_same_job():
    calls.clear()
    async with SessionLocal() as db:
        jobs.enqueue(db, "test_slow", {"n": 1})
        jobs.enqueue(db, "test_slow", {"n": 2})
        await db.commit()

    async def worker() -> None:
        async with SessionLocal() as db:
            await jobs.run_once(db)

    await asyncio.gather(worker(), worker())
    assert sorted(calls) == [1, 2]  # каждая задача ровно один раз

    async with SessionLocal() as db:
        assert await jobs.run_once(db) is False


async def test_job_fails_after_max_attempts():
    async with SessionLocal() as db:
        jobs.enqueue(db, "test_broken", {})
        await db.commit()
    for _ in range(jobs.MAX_ATTEMPTS):
        await _due_now()
        async with SessionLocal() as db:
            assert await jobs.run_once(db) is True
    async with SessionLocal() as db:
        job = await db.scalar(select(Job).where(Job.kind == "test_broken"))
        assert job.failed and job.done_at is not None and job.attempts == jobs.MAX_ATTEMPTS
        assert await jobs.stats(db) == {"pending": 0, "failed": 1}
