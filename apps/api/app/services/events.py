"""Своя аналитика: события воронки пишутся в таблицу events. Каталог: docs/events.md."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event


def track(
    db: AsyncSession,
    name: str,
    user_id: uuid.UUID | None = None,
    entity_type: str = "",
    entity_id: object = "",
    **props: object,
) -> None:
    # Без commit: событие сохраняется в той же транзакции, что и действие.
    db.add(
        Event(
            name=name,
            user_id=user_id,
            entity_type=entity_type,
            entity_id=str(entity_id),
            props=props,
        )
    )
