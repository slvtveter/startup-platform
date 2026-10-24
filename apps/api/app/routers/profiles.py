from typing import Annotated

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser
from app.db.session import DbSession
from app.schemas.common import Page
from app.schemas.profile import MyProfileOut, PersonCard, PersonDetail, ProfileUpdate, PublishIn
from app.services import profiles as service

router = APIRouter(tags=["profiles"])


@router.get("/profile/me", response_model=MyProfileOut)
async def get_my_profile(user: CurrentUser, db: DbSession) -> MyProfileOut:
    return await service.my_profile(db, user)


@router.patch("/profile/me", response_model=MyProfileOut)
async def update_my_profile(data: ProfileUpdate, user: CurrentUser, db: DbSession) -> MyProfileOut:
    await service.update_profile(db, user, data)
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
    q: str | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 24,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[PersonCard]:
    rows, total = await service.list_people(db, role, skill, level, looking_for, q, limit, offset)
    return Page(items=[service.to_card(p) for p in rows], total=total, limit=limit, offset=offset)


@router.get("/people/{slug}", response_model=PersonDetail)
async def get_person(slug: str, db: DbSession) -> PersonDetail:
    return await service.to_detail(db, await service.get_public(db, slug))
