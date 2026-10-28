from datetime import datetime

from pydantic import BaseModel, Field


class ChatPeer(BaseModel):
    """Собеседник: имя и ссылка на профиль (если он опубликован)."""

    user_id: str
    display_name: str
    slug: str | None
    avatar_url: str | None
    headline: str


class ChatApplicationRef(BaseModel):
    """Отклик или приглашение, из которого родилось сообщение."""

    id: str
    direction: str
    status: str
    role_title: str
    startup_title: str
    startup_slug: str


class MessageOut(BaseModel):
    id: int
    body: str
    mine: bool
    created_at: datetime
    application: ChatApplicationRef | None


class ConversationOut(BaseModel):
    id: str
    peer: ChatPeer
    last_message: MessageOut | None
    last_message_at: datetime
    unread: int
    # О чём разговор: последний отклик или приглашение в этом диалоге (если был).
    context: ChatApplicationRef | None = None


class ConversationRef(BaseModel):
    id: str


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class StartChatIn(BaseModel):
    slug: str = Field(min_length=1, max_length=100)
    body: str = Field(min_length=1, max_length=4000)


class UnreadOut(BaseModel):
    count: int
