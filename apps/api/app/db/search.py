"""Полнотекстовый поиск (KAN-104): вычисляемые tsvector-колонки и общий запрос."""

from sqlalchemy import Computed, Index, func
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import mapped_column

# Русская морфология: «дизайнеры» и «дизайнер», «доставку» и «доставка» — одна основа.
# Латиница (React, Figma) в конфигурации russian идёт через английский стеммер.
CONFIG = "russian"
# Короче — ищем префиксом по названию: в 1–2 буквах нечего стеммить.
MIN_FTS_LEN = 3


def search_column(*weighted: tuple[str, str]):
    """tsvector из колонок с весами A–D; пересчитывается самим Postgres при изменении строки."""
    expr = " || ".join(
        f"setweight(to_tsvector('{CONFIG}', coalesce({col}, '')), '{w}')" for col, w in weighted
    )
    return mapped_column(TSVECTOR, Computed(expr, persisted=True), deferred=True)


def search_index(table: str) -> Index:
    return Index(f"ix_{table}_search", "search", postgresql_using="gin")


def query(q: str):
    return func.websearch_to_tsquery(CONFIG, q)
