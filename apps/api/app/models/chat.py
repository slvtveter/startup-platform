import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Conversation(Base):
    """Личный диалог двух людей (KAN-127). Один на пару: отклики и приглашения падают сюда же.

    user_a_id < user_b_id — канонический порядок, чтобы пара была уникальной.
    """

    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("user_a_id", "user_b_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_a_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    user_b_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    # Кто начал диалог: для дневного лимита новых диалогов.
    started_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_message_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    # До какого момента каждый участник прочитал диалог: из этого считаем непрочитанные.
    a_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    b_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user_a = relationship("User", foreign_keys=[user_a_id], lazy="joined")
    user_b = relationship("User", foreign_keys=[user_b_id], lazy="joined")


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (Index("ix_messages_conversation_id_id", "conversation_id", "id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE")
    )
    sender_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    body: Mapped[str] = mapped_column(Text)
    # Сообщение, которое родилось из отклика или приглашения: в чате рисуется карточкой роли.
    application_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("applications.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", lazy="joined")
