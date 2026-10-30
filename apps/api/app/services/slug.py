import re
import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

_TRANSLIT = dict(
    zip(
        "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
        "a b v g d e e zh z i y k l m n o p r s t u f h ts ch sh sch - y - e yu ya".split(),
        strict=True,
    )
)


def slugify(text: str) -> str:
    out = []
    for ch in text.lower():
        t = _TRANSLIT.get(ch, ch)
        out.append("" if t == "-" else t)
    slug = re.sub(r"[^a-z0-9]+", "-", "".join(out)).strip("-")
    return slug[:60] or "item"


# Заняты маршрутами: /startups/new на сайте, /api/startups/facets в API.
RESERVED = {"new", "facets"}


async def unique_slug(db: AsyncSession, model, text: str, exclude_id=None) -> str:
    base = slugify(text)
    candidate = base
    while True:
        stmt = select(model.id).where(model.slug == candidate)
        if exclude_id is not None:
            stmt = stmt.where(model.id != exclude_id)
        if candidate not in RESERVED and (await db.scalar(stmt)) is None:
            return candidate
        candidate = f"{base}-{secrets.token_hex(2)}"
