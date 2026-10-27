from typing import Annotated

from fastapi import APIRouter, Query, UploadFile

from app.core.deps import CurrentUser, OptionalUser
from app.db.session import DbSession
from app.schemas.common import Page
from app.schemas.profile import MyProfileOut, PersonCard, PersonDetail, ProfileUpdate, PublishIn
from app.services import avatars
from app.services import profiles as service

router = APIRouter(tags=["profiles"])


@router.get("/profile/me", response_model=MyProfileOut)
async def get_my_profile(user: CurrentUser, db: DbSession) -> MyProfileOut:
    return await service.my_profile(db, user)


@router.patch("/profile/me", response_model=MyProfileOut)
async def update_my_profile(data: ProfileUpdate, user: CurrentUser, db: DbSession) -> MyProfileOut:
    await service.update_profile(db, user, data)
    return await service.my_profile(db, user)


@router.post("/profile/me/avatar", response_model=MyProfileOut)
async def upload_my_avatar(file: UploadFile, user: CurrentUser, db: DbSession) -> MyProfileOut:
    # Читаем на байт больше лимита: так узнаём о превышении, не загружая весь файл в память.
    data = await file.read(avatars.MAX_BYTES + 1)
    await avatars.upload(db, user.profile, data)
    return await service.my_profile(db, user)


@router.delete("/profile/me/avatar", response_model=MyProfileOut)
async def delete_my_avatar(user: CurrentUser, db: DbSession) -> MyProfileOut:
    await avatars.remove(db, user.profile)
    return await service.my_profile(db, user)


@router.post("/profile/me/publish", response_model=MyProfileOut)
async def publish_my_profile(data: PublishIn, user: CurrentUser, db: DbSession) -> MyProfileOut:
    await service.set_published(db, user, data.published)
    return await service.my_profile(db, user)


@router.get("/people", response_model=Page[PersonCard])
async def list_people(
    db: DbSession,
    role: Annotated[list[str], Query()] = [],  # noqa: B006
    skill: Annotated[list[str], Query()] = [],  # noqa: B006
    level: Annotated[list[str], Query()] = [],  # noqa: B006
    looking_for: Annotated[list[str], Query()] = [],  # noqa: B006
    cofound: bool = False,
    q: str | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 24,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[PersonCard]:
    """looking_for — условия (любое из); cofound — только ищущие сообщников, вместе с условиями."""
    rows, total = await service.list_people(
        db, role, skill, level, looking_for, q, limit, offset, cofound=cofound
    )
    return Page(items=[service.to_card(p) for p in rows], total=total, limit=limit, offset=offset)


@router.get("/people/{slug}", response_model=PersonDetail)
async def get_person(slug: str, user: OptionalUser, db: DbSession) -> PersonDetail:
    return await service.to_detail(db, await service.get_public(db, slug, user))
