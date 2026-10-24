"""Личные сообщения (KAN-127): диалог на пару людей, отклики — первые сообщения в нём.

Реалтайм: после записи шлём pg_notify('chat', ...) с id участников, а chat_hub в каждом
процессе api пересылает событие открытым WebSocket. Тело сообщения в NOTIFY не кладём:
клиент сам дочитывает диалог по API, поэтому права проверяются в одном месте.
"""

import json
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError, Forbidden, NotFound, TooManyRequests
from app.models import Application, Conversation, Message, User
from app.schemas.chat import ChatApplicationRef, ChatPeer, ConversationOut, MessageOut
from app.services import profiles as profile_service
from app.services.events import track

# Новых диалогов в сутки от одного человека: защита от рассылок.
NEW_CHATS_PER_DAY = 20
# Живой человек столько не напишет за минуту в один диалог; бот-спамер упрётся.
MESSAGES_PER_MINUTE = 20
PAGE = 50


def _now() -> datetime:
    return datetime.now(UTC)


def _pair(u1: uuid.UUID, u2: uuid.UUID) -> tuple[uuid.UUID, uuid.UUID]:
    return (u1, u2) if str(u1) < str(u2) else (u2, u1)


def _is_a(conv: Conversation, user: User) -> bool:
    return conv.user_a_id == user.id


def peer_of(conv: Conversation, user: User) -> User:
    return conv.user_b if _is_a(conv, user) else conv.user_a


def _peer_out(u: User) -> ChatPeer:
    p = u.profile
    return ChatPeer(
        user_id=str(u.id),
        display_name=(p.display_name if p and p.display_name else u.email.split("@")[0]),
        slug=p.slug if p and p.is_published else None,
        avatar_url=p.avatar_url if p and p.is_published else None,
        headline=p.headline if p and p.is_published else "",
    )


def message_out(m: Message, viewer: User) -> MessageOut:
    ref = None
    if m.application is not None:
        role = m.application.startup_role
        ref = ChatApplicationRef(
            id=str(m.application.id),
            direction=m.application.direction.value,
            status=m.application.status.value,
            role_title=role.title,
            startup_title=role.startup.title,
            startup_slug=role.startup.slug,
        )
    return MessageOut(
        id=m.id,
        body=m.body,
        mine=m.sender_id == viewer.id,
        created_at=m.created_at,
        application=ref,
    )


async def get_or_create(db: AsyncSession, u1: User, u2: User) -> Conversation:
    """Диалог пары; если его нет, создаём от имени u1 (он и начал разговор)."""
    a, b = _pair(u1.id, u2.id)
    conv = await db.scalar(
        select(Conversation).where(Conversation.user_a_id == a, Conversation.user_b_id == b)
    )
    if conv is None:
        conv = Conversation(user_a_id=a, user_b_id=b, started_by_id=u1.id)
        db.add(conv)
        await db.flush()
        await db.refresh(conv)
    return conv


async def ensure_can_send(db: AsyncSession, conv: Conversation, user: User) -> None:
    recent = await db.scalar(
        select(func.count()).where(
            Message.conversation_id == conv.id,
            Message.sender_id == user.id,
            Message.created_at > _now() - timedelta(minutes=1),
        )
    )
    if (recent or 0) >= MESSAGES_PER_MINUTE:
        raise TooManyRequests("Слишком много сообщений подряд. Подождите минуту.")


async def post(
    db: AsyncSession,
    conv: Conversation,
    sender: User,
    body: str,
    application: Application | None = None,
) -> Message:
    """Записать сообщение, отметить диалог прочитанным для отправителя и разбудить получателя."""
    now = _now()
    msg = Message(
        conversation_id=conv.id,
        sender_id=sender.id,
        body=body.strip(),
        application_id=application.id if application else None,
    )
    db.add(msg)
    conv.last_message_at = now
    if _is_a(conv, sender):
        conv.a_read_at = now
    else:
        conv.b_read_at = now
    await db.flush()
    payload = json.dumps(
        {"conversation_id": str(conv.id), "users": [str(conv.user_a_id), str(conv.user_b_id)]}
    )
    # NOTIFY доставляется только после COMMIT — получатель не увидит незаписанное сообщение.
    await db.execute(text("SELECT pg_notify('chat', :p)"), {"p": payload})
    return msg


async def get_for(db: AsyncSession, conv_id: uuid.UUID, user: User) -> Conversation:
    conv = await db.get(Conversation, conv_id)
    if conv is None or user.id not in (conv.user_a_id, conv.user_b_id):
        raise NotFound("Диалог не найден")
    return conv


async def _unread(db: AsyncSession, conv: Conversation, user: User) -> int:
    read_at = conv.a_read_at if _is_a(conv, user) else conv.b_read_at
    q = select(func.count()).where(Message.conversation_id == conv.id, Message.sender_id != user.id)
    if read_at is not None:
        q = q.where(Message.created_at > read_at)
    return await db.scalar(q) or 0


def _mine(user: User):
    return or_(Conversation.user_a_id == user.id, Conversation.user_b_id == user.id)


async def summary(db: AsyncSession, conv: Conversation, user: User) -> ConversationOut:
    last = await db.scalar(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.id.desc())
        .limit(1)
    )
    return ConversationOut(
        id=str(conv.id),
        peer=_peer_out(peer_of(conv, user)),
        last_message=message_out(last, user) if last else None,
        last_message_at=conv.last_message_at,
        unread=await _unread(db, conv, user),
    )


async def list_for(
    db: AsyncSession, user: User, limit: int, offset: int
) -> tuple[list[ConversationOut], int]:
    total = await db.scalar(select(func.count()).select_from(Conversation).where(_mine(user)))
    convs = list(
        (
            await db.scalars(
                select(Conversation)
                .where(_mine(user))
                .order_by(Conversation.last_message_at.desc())
                .limit(limit)
                .offset(offset)
            )
        ).unique()
    )
    out = [await summary(db, c, user) for c in convs]
    return out, total or 0


async def unread_total(db: AsyncSession, user: User) -> int:
    """Сколько диалогов с непрочитанным: для бейджа в шапке."""
    a_side = and_(Conversation.user_a_id == user.id, Message.sender_id == Conversation.user_b_id)
    b_side = and_(Conversation.user_b_id == user.id, Message.sender_id == Conversation.user_a_id)
    unread_a = and_(
        a_side,
        or_(Conversation.a_read_at.is_(None), Message.created_at > Conversation.a_read_at),
    )
    unread_b = and_(
        b_side,
        or_(Conversation.b_read_at.is_(None), Message.created_at > Conversation.b_read_at),
    )
    n = await db.scalar(
        select(func.count(func.distinct(Conversation.id)))
        .select_from(Conversation)
        .join(Message, Message.conversation_id == Conversation.id)
        .where(or_(unread_a, unread_b))
    )
    return n or 0


async def messages(
    db: AsyncSession, conv: Conversation, user: User, before: int | None
) -> list[MessageOut]:
    q = select(Message).where(Message.conversation_id == conv.id)
    if before is not None:
        q = q.where(Message.id < before)
    rows = list((await db.scalars(q.order_by(Message.id.desc()).limit(PAGE))).unique())
    return [message_out(m, user) for m in reversed(rows)]


async def mark_read(db: AsyncSession, conv: Conversation, user: User) -> None:
    if _is_a(conv, user):
        conv.a_read_at = _now()
    else:
        conv.b_read_at = _now()
    await db.commit()


async def start(db: AsyncSession, user: User, slug: str, body: str) -> Conversation:
    """Написать человеку из каталога «Люди»."""
    if user.email_verified_at is None:
        raise Forbidden("Чтобы писать людям, подтвердите почту")
    target = await profile_service.get_public(db, slug)
    if target.user_id == user.id:
        raise AppError("Нельзя написать самому себе")
    a, b = _pair(user.id, target.user_id)
    exists_ = await db.scalar(
        select(Conversation.id).where(Conversation.user_a_id == a, Conversation.user_b_id == b)
    )
    if exists_ is None:
        started = await db.scalar(
            select(func.count()).where(
                Conversation.started_by_id == user.id,
                Conversation.created_at > _now() - timedelta(days=1),
            )
        )
        if (started or 0) >= NEW_CHATS_PER_DAY:
            raise AppError("Достигнут дневной лимит новых диалогов. Попробуйте завтра.")
        track(db, "chat_started", user.id, "user", target.user_id)
    conv = await get_or_create(db, user, target.user)
    await ensure_can_send(db, conv, user)
    await post(db, conv, user, body)
    await db.commit()
    return conv


async def for_application(db: AsyncSession, app_id: uuid.UUID, user: User) -> Conversation:
    app = await db.get(Application, app_id)
    if app is None:
        raise NotFound("Отклик не найден")
    founder = app.startup_role.startup.owner
    if user.id not in (app.applicant_id, founder.id):
        raise NotFound("Отклик не найден")
    applicant = await db.get(User, app.applicant_id)
    conv = await get_or_create(db, applicant, founder)
    await db.commit()
    return conv
