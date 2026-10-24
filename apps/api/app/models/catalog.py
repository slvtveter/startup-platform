from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Role(Base):
    """Справочник ролей: дизайнер, backend, маркетолог..."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    sort: Mapped[int] = mapped_column(Integer, default=0)


class Skill(Base):
    """Справочник навыков-тегов."""

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(64), default="other")
