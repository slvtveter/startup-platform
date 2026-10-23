import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ApplicationDirection, ApplicationStatus


class Application(Base):
    """Отклик кандидата на роль или приглашение от основателя."""

    __tablename__ = "applications"
    __table_args__ = (
        # Один активный отклик пользователя на роль.
        Index(
            "uq_applications_active",
            "startup_role_id",
            "applicant_id",
            unique=True,
            postgresql_where=text("status IN ('pending', 'accepted')"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    startup_role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("startup_roles.id", ondelete="CASCADE"), index=True
    )
    applicant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    direction: Mapped[ApplicationDirection] = mapped_column(
        Enum(ApplicationDirection, native_enum=False, length=16)
    )
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, native_enum=False, length=16), default=ApplicationStatus.pending
    )
    decision_note: Mapped[str] = mapped_column(String(300), default="")
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    startup_role: Mapped["StartupRole"] = relationship(lazy="joined")  # noqa: F821
    applicant: Mapped["User"] = relationship(lazy="joined")  # noqa: F821
