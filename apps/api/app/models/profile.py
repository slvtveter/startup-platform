import uuid
from pathlib import Path

from sqlalchemy import Boolean, Column, Enum, ForeignKey, String, Table, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import get_settings
from app.db.base import Base, TimestampMixin
from app.db.search import search_column, search_index
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
    __table_args__ = (search_index("profiles"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    display_name: Mapped[str] = mapped_column(String(80), default="")
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    headline: Mapped[str] = mapped_column(String(140), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    search = search_column(("display_name", "A"), ("headline", "B"), ("bio", "C"))
    primary_role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id"), index=True)
    experience_level: Mapped[ExperienceLevel | None] = mapped_column(
        Enum(ExperienceLevel, native_enum=False, length=32)
    )
    availability: Mapped[Availability | None] = mapped_column(
        Enum(Availability, native_enum=False, length=32)
    )
    looking_for: Mapped[list[str]] = mapped_column(ARRAY(String(16)), default=list)
    city: Mapped[str] = mapped_column(String(80), default="")
    # Где учится или учился: «ВШЭ, 3 курс» — для студентов это главный «опыт».
    education: Mapped[str] = mapped_column(String(120), default="", server_default="")
    contact_telegram: Mapped[str] = mapped_column(String(64), default="")
    show_email: Mapped[bool] = mapped_column(Boolean, default=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    user: Mapped["User"] = relationship(back_populates="profile", lazy="joined")  # noqa: F821
    primary_role: Mapped[Role | None] = relationship(lazy="joined")
    # Ключ аватара в хранилище (KAN-34): файлы <key>-256.webp и <key>-64.webp.
    avatar_key: Mapped[str | None] = mapped_column(String(120))

    @property
    def avatar_url(self) -> str | None:
        return f"/media/{self.avatar_key}-256.webp" if self.avatar_key else None

    @property
    def avatar_url_lg(self) -> str | None:
        """Самый крупный из имеющихся размеров: 1024, иначе 512, иначе 256 (старые аватары)."""
        if not self.avatar_key:
            return None
        media = Path(get_settings().media_dir)
        for size in (1024, 512):
            if (media / f"{self.avatar_key}-{size}.webp").exists():
                return f"/media/{self.avatar_key}-{size}.webp"
        return self.avatar_url

    # Резюме PDF: лежит в media/resumes, наружу его отдаёт только api и только вошедшим.
    resume_key: Mapped[str | None] = mapped_column(String(160))
    resume_name: Mapped[str] = mapped_column(String(160), default="", server_default="")

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
