"""Синтетическая нагрузка на events для замеров планов запросов (KAN-105). Только local/test.

  uv run python -m app.scripts.perf_seed            # 100 тыс. событий
  uv run python -m app.scripts.perf_seed --rows 500000

Пишет события с props.perf = "1"; повторный запуск сначала удаляет прошлую синтетику.
"""

import argparse
import asyncio
import random
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, insert, select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import Event, Startup, User

# Пропорции примерно как в живой воронке: просмотров на порядки больше, чем действий.
NAMES = [
    ("startup_viewed", 55),
    ("landing_viewed", 25),
    ("apply_started", 6),
    ("recommendation_shown", 8),
    ("application_sent", 3),
    ("profile_completed", 2),
    ("signup", 1),
]
BATCH = 5000


async def main(rows: int) -> None:
    if get_settings().env not in ("local", "test"):
        raise SystemExit("perf_seed запускается только в local/test")
    names, weights = zip(*NAMES, strict=True)
    now = datetime.now(UTC)
    async with SessionLocal() as db:
        await db.execute(delete(Event).where(Event.props["perf"].astext == "1"))
        slugs = list(await db.scalars(select(Startup.slug))) or ["demo"]
        users = list(await db.scalars(select(User.id))) or [None]
        # ~3 тыс. посетителей в день, у каждого несколько событий.
        visitors = [uuid.uuid4().hex[:24] for _ in range(3000)]
        for start in range(0, rows, BATCH):
            chunk = []
            for _ in range(min(BATCH, rows - start)):
                name = random.choices(names, weights)[0]
                props = {"perf": "1", "v": random.choice(visitors)}
                if name in ("startup_viewed", "apply_started"):
                    props["slug"] = random.choice(slugs)
                chunk.append(
                    {
                        "name": name,
                        "user_id": random.choice(users) if random.random() < 0.3 else None,
                        "props": props,
                        "created_at": now - timedelta(seconds=random.randint(0, 90 * 86400)),
                    }
                )
            await db.execute(insert(Event), chunk)
        await db.commit()
    print(f"perf_seed: {rows} событий")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--rows", type=int, default=100_000)
    asyncio.run(main(p.parse_args().rows))
