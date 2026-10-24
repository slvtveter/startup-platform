import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.catalog import Role, Skill
from app.models.enums import Stage, StartupStatus, Terms

startup_role_skills = Table(
    "startup_role_skills",
    Base.metadata,
    Column("startup_role_id", ForeignKey("startup_roles.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
)


class Startup(TimestampMixin, Base):
    __tablename__ = "startups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(80))
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    pitch: Mapped[str] = mapped_column(String(160), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    stage: Mapped[Stage] = mapped_column(Enum(Stage, native_enum=False, length=16))
    terms: Mapped[Terms] = mapped_column(Enum(Terms, native_enum=False, length=16))
    terms_details: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[StartupStatus] = mapped_column(
        Enum(StartupStatus, native_enum=False, length=16), default=StartupStatus.draft, index=True
    )
    website: Mapped[str] = mapped_column(String(300), default="")
    telegram: Mapped[str] = mapped_column(String(100), default="")
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)  # скрыт модератором
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    owner: Mapped["User"] = relationship(lazy="joined")  # noqa: F821
    roles: Mapped[list["StartupRole"]] = relationship(
        back_populates="startup",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="StartupRole.created_at",
    )
    members: Mapped[list["StartupMember"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="StartupMember.joined_at"
    )


class StartupRole(Base):
    __tablename__ = "startup_roles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    startup_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("startups.id", ondelete="CASCADE"), index=True
    )
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    slots: Mapped[int] = mapped_column(Integer, default=1)
    hours_per_week: Mapped[int | None] = mapped_column(Integer)
    outcome: Mapped[str] = mapped_column(Text, default="", server_default="")  # «что получишь»
    is_open: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    startup: Mapped[Startup] = relationship(back_populates="roles", lazy="joined")
    role: Mapped[Role] = relationship(lazy="joined")
    skills: Mapped[list[Skill]] = relationship(secondary=startup_role_skills, lazy="selectin")


class StartupMember(Base):
    __tablename__ = "startup_members"
    __table_args__ = (UniqueConstraint("startup_id", "user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    startup_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("startups.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role_title: Mapped[str] = mapped_column(String(100))
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(lazy="joined")  # noqa: F821
