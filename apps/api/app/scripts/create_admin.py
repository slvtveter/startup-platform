"""Выдать права администратора: `make create-admin email=you@example.com`."""

import asyncio
import sys

from sqlalchemy import update

from app.db.session import SessionLocal
from app.models import User


async def main(email: str) -> None:
    async with SessionLocal() as db:
        result = await db.execute(
            update(User).where(User.email == email.lower()).values(is_admin=True)
        )
        await db.commit()
    print("ok" if result.rowcount else f"user {email} not found")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
