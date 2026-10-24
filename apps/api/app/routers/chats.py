import uuid

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.core.deps import CurrentUser
from app.db.session import DbSession, SessionLocal
from app.schemas.chat import (
    ConversationOut,
    ConversationRef,
    MessageIn,
    MessageOut,
    StartChatIn,
    UnreadOut,
)
from app.schemas.common import OkOut, Page
from app.services import auth as auth_service
from app.services import chat as service
from app.services.chat_hub import hub

router = APIRouter(tags=["chats"])


@router.get("/chats", response_model=Page[ConversationOut])
async def list_chats(
    user: CurrentUser,
    db: DbSession,
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> Page[ConversationOut]:
    items, total = await service.list_for(db, user, limit, offset)
    return Page(items=items, total=total, limit=limit, offset=offset)


@router.get("/chats/unread", response_model=UnreadOut)
async def unread_chats(user: CurrentUser, db: DbSession) -> UnreadOut:
    return UnreadOut(count=await service.unread_total(db, user))


@router.post("/chats", response_model=ConversationRef, status_code=201)
async def start_chat(data: StartChatIn, user: CurrentUser, db: DbSession) -> ConversationRef:
    conv = await service.start(db, user, data.slug, data.body)
    return ConversationRef(id=str(conv.id))


@router.get("/chats/by-application/{app_id}", response_model=ConversationRef)
async def chat_for_application(
    app_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> ConversationRef:
    conv = await service.for_application(db, app_id, user)
    return ConversationRef(id=str(conv.id))


@router.get("/chats/{conv_id}", response_model=ConversationOut)
async def get_chat(conv_id: uuid.UUID, user: CurrentUser, db: DbSession) -> ConversationOut:
    conv = await service.get_for(db, conv_id, user)
    return await service.summary(db, conv, user)


@router.get("/chats/{conv_id}/messages", response_model=list[MessageOut])
async def list_messages(
    conv_id: uuid.UUID, user: CurrentUser, db: DbSession, before: int | None = None
) -> list[MessageOut]:
    conv = await service.get_for(db, conv_id, user)
    return await service.messages(db, conv, user, before)


@router.post("/chats/{conv_id}/messages", response_model=MessageOut, status_code=201)
async def send_message(
    conv_id: uuid.UUID, data: MessageIn, user: CurrentUser, db: DbSession
) -> MessageOut:
    conv = await service.get_for(db, conv_id, user)
    await service.ensure_can_send(db, conv, user)
    msg = await service.post(db, conv, user, data.body)
    await db.commit()
    await db.refresh(msg)
    return service.message_out(msg, user)


@router.post("/chats/{conv_id}/read", response_model=OkOut)
async def read_chat(conv_id: uuid.UUID, user: CurrentUser, db: DbSession) -> OkOut:
    conv = await service.get_for(db, conv_id, user)
    await service.mark_read(db, conv, user)
    return OkOut()


@router.websocket("/chats/ws")
async def chat_socket(ws: WebSocket) -> None:
    """Поток событий «в диалоге новое сообщение». Сами сообщения клиент читает по REST."""
    settings = get_settings()
    # Браузер всегда шлёт Origin для WebSocket: чужой сайт не подключится от имени пользователя.
    origin = ws.headers.get("origin")
    if origin and origin not in settings.allowed_origins:
        await ws.close(code=4403)
        return
    token = ws.cookies.get(settings.session_cookie_name)
    async with SessionLocal() as db:
        user = await auth_service.user_by_session(db, token) if token else None
    if user is None:
        await ws.close(code=4401)
        return
    await hub.ensure_listening()
    await ws.accept()
    uid = str(user.id)
    hub.add(uid, ws)
    try:
        while True:
            await ws.receive_text()  # клиент шлёт ping, чтобы прокси не рвал соединение
    except WebSocketDisconnect:
        pass
    finally:
        hub.remove(uid, ws)
