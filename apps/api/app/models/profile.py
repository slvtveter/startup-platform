import uuid

from sqlalchemy import ARRAY, Boolean, Column, Enum, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.catalog import Role, Skill
from app.models.enums import Availability, ExperienceLevel, LinkKind

profile_skills = Table(
    "profile_skills",
    Base.metadata,
    Column("profile_id", ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
)


class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    display_name: Mapped[str] = mapped_column(String(80), default="")
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    headline: Mapped[str] = mapped_column(String(140), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    primary_role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id"), index=True)
    experience_level: Mapped[ExperienceLevel | None] = mapped_column(
        Enum(ExperienceLevel, native_enum=False, length=32)
    )
    availability: Mapped[Availability | None] = mapped_column(
        Enum(Availability, native_enum=False, length=32)
    )
    looking_for: Mapped[list[str]] = mapped_column(ARRAY(String(16)), default=list)
    city: Mapped[str] = mapped_column(String(80), default="")
    contact_telegram: Mapped[str] = mapped_column(String(64), default="")
    show_email: Mapped[bool] = mapped_column(Boolean, default=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    user: Mapped["User"] = relationship(back_populates="profile", lazy="joined")  # noqa: F821
    primary_role: Mapped[Role | None] = relationship(lazy="joined")
    skills: Mapped[list[Skill]] = relationship(secondary=profile_skills, lazy="selectin")
    links: Mapped[list["ProfileLink"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="ProfileLink.id"
    )


class ProfileLink(Base):
    __tablename__ = "profile_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[LinkKind] = mapped_column(Enum(LinkKind, native_enum=False, length=16))
    url: Mapped[str] = mapped_column(String(500))
