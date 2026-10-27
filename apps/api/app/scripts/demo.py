"""Примеры для пустого прода: 10 стартапов и 30 человек с пометкой «Пример» (app.core.demo).

  python -m app.scripts.demo add      — создать (идемпотентно)
  python -m app.scripts.demo remove   — удалить всё демо вместе с фото
  python -m app.scripts.demo reset    — удалить и создать заново (после правки данных)

Данные — в demo_data.py, фото — в demo_media. Почта @demo.invalid: войти нельзя, письма туда
не уходят, откликнуться, пригласить или написать нельзя.
"""

import asyncio
import io
import secrets
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

from PIL import Image, ImageOps
from sqlalchemy import select

from app.core.demo import DEMO_EMAIL_DOMAIN
from app.db.session import SessionLocal
from app.models import Profile, ProfileLink, Startup, StartupMember, StartupRole, User
from app.models.enums import LinkKind, StartupStatus
from app.scripts.catalog import ensure_catalog
from app.scripts.demo_data import FOUNDERS, PEOPLE, STARTUPS, Person
from app.services import covers
from app.services.avatars import SIZES
from app.services.slug import unique_slug
from app.services.storage import get_storage

MEDIA = Path(__file__).parent / "demo_media"

OUTCOME = {
    "free": "Кейс в портфолио, рекомендация от основателя и опыт работы в команде",
    "paid": "Оплата за задачи и кейс в портфолио",
    "negotiable": "Условия обсудим на созвоне, кейс в портфолио",
}


def _save_avatar(profile: Profile, key: str) -> None:
    storage = get_storage()
    base = f"avatars/{profile.id}-{secrets.token_hex(4)}"
    with Image.open(MEDIA / "people" / f"{key}.jpg") as img:
        img = img.convert("RGB")
        for size in SIZES:
            buf = io.BytesIO()
            ImageOps.fit(img, (size, size), Image.Resampling.LANCZOS).save(buf, "WEBP", quality=85)
            storage.save(f"{base}-{size}.webp", buf.getvalue())
    profile.avatar_key = base


def _link(url: str) -> ProfileLink:
    kind = LinkKind.github if "github" in url else LinkKind.behance
    return ProfileLink(kind=kind, url=url)


async def add() -> None:
    async with SessionLocal() as db:
        roles, skills = await ensure_catalog(db)
        users: dict[str, User] = {}
        person: Person
        for person in [*FOUNDERS, *PEOPLE]:
            email = f"{person.key}@{DEMO_EMAIL_DOMAIN}"
            user = await db.scalar(select(User).where(User.email == email))
            if user is None:
                # Пароля нет: в демо-аккаунт нельзя войти.
                user = User(email=email, password_hash=None, email_verified_at=datetime.now(UTC))
                user.profile = Profile(
                    slug=await unique_slug(db, Profile, person.name),
                    display_name=person.name,
                    headline=person.headline,
                    bio=person.bio,
                    primary_role_id=roles[person.role].id,
                    experience_level=person.level,
                    availability=person.availability,
                    looking_for=person.looking_for,
                    city=person.city,
                    show_email=False,
                    is_published=True,
                    skills=[skills[s] for s in person.skills],
                    links=[_link(person.link)] if person.link else [],
                )
                db.add(user)
                await db.flush()
                _save_avatar(user.profile, person.key)
            users[person.key] = user

        now = datetime.now(UTC)
        for i, idea in enumerate(STARTUPS):
            owner = users[idea.owner]
            # Свой стартап у демо-основателя уже есть — не дублируем.
            if await db.scalar(
                select(Startup.id).where(Startup.owner_id == owner.id, Startup.title == idea.title)
            ):
                continue
            s = Startup(
                owner_id=owner.id,
                title=idea.title,
                slug=await unique_slug(db, Startup, idea.title),
                pitch=idea.pitch,
                description=idea.description,
                stage=idea.stage,
                terms=idea.terms,
                terms_details=idea.terms_details,
                status=StartupStatus.recruiting,
                published_at=now - timedelta(days=i * 2 + 1, hours=i * 5),
            )
            s.roles = [
                StartupRole(
                    role_id=roles[r.role].id,
                    title=r.title,
                    description=r.what,
                    slots=1,
                    hours_per_week=r.hours,
                    outcome=OUTCOME[idea.terms],
                    skills=[skills[x] for x in r.skills],
                )
                for r in idea.roles
            ]
            s.members = [
                StartupMember(user_id=users[key].id, role_title=title) for key, title in idea.team
            ]
            db.add(s)
            await db.flush()
            data = await asyncio.to_thread((MEDIA / "covers" / f"{idea.key}.jpg").read_bytes)
            covers.save(s, await asyncio.to_thread(covers.render, data))
        await db.commit()
    print(f"demo: {len(FOUNDERS) + len(PEOPLE)} people, {len(STARTUPS)} startups")


async def remove() -> None:
    async with SessionLocal() as db:
        demo = (
            await db.scalars(select(User).where(User.email.like(f"%@{DEMO_EMAIL_DOMAIN}")))
        ).all()
        keys = [u.profile.avatar_key for u in demo if u.profile and u.profile.avatar_key]
        owned = (
            await db.scalars(select(Startup).where(Startup.owner_id.in_([u.id for u in demo])))
        ).all()
        cover_keys = [s.cover_key for s in owned]
        for u in demo:
            # Стартапы и профили удаляются каскадом вместе с пользователем.
            await db.delete(u)
        await db.commit()
    storage = get_storage()
    for key in keys:
        for size in SIZES:
            storage.delete(f"{key}-{size}.webp")
    for key in cover_keys:
        covers.drop(key)
    print(f"demo removed: {len(demo)} users")


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action not in {"add", "remove", "reset"}:
        sys.exit("usage: python -m app.scripts.demo add|remove|reset")
    if action == "reset":
        asyncio.run(remove())
        action = "add"
    asyncio.run(add() if action == "add" else remove())
