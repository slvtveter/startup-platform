"""Полнотекстовый поиск (KAN-104): вычисляемые tsvector-колонки и общий запрос."""

import re

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
    """Обычный запрос плюс совпадение по началу слов: «дизайн» находит «дизайнер»."""
    words = re.findall(r"\w+", q.lower())
    base = func.websearch_to_tsquery(CONFIG, q)
    if not words:
        return base
    prefix = func.to_tsquery(CONFIG, " & ".join(f"{w}:*" for w in words[:6]))
    return base.op("||")(prefix)


def _clean(q: str) -> str:
    return q.replace("\\", "").replace("%", "").replace("_", "")


def like(q: str) -> str:
    """Шаблон ILIKE «содержит» без спецсимволов пользователя (для навыков и ролей: ML, UX, Go)."""
    return f"%{_clean(q)}%"


def word_start(column, q: str):
    """Совпадение с началом любого слова: «Вк» находит «ВкусноРядом», «ус» — нет."""
    c = _clean(q)
    return column.ilike(f"{c}%") | column.ilike(f"% {c}%")
