import uuid
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, OptionalUser
from app.db.session import DbSession
from app.models.enums import StartupStatus
from app.schemas.application import ApplicationOut
from app.schemas.common import OkOut, Page
from app.schemas.startup import (
    MyStartupOut,
    RecommendedStartup,
    RoleIn,
    RoleUpdate,
    StartupCard,
    StartupDetail,
    StartupIn,
    StartupUpdate,
)
from app.services import applications as app_service
from app.services import startups as service

router = APIRouter(tags=["startups"])


@router.get("/startups", response_model=Page[StartupCard])
async def list_startups(
    db: DbSession,
    role: Annotated[list[str], Query()] = [],  # noqa: B006
    skill: Annotated[list[str], Query()] = [],  # noqa: B006
    terms: Annotated[list[str], Query()] = [],  # noqa: B006
    stage: Annotated[list[str], Query()] = [],  # noqa: B006
    q: str | None = None,
    sort: Annotated[str, Query(pattern="^(new|roles)$")] = "new",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[StartupCard]:
    rows, total = await service.list_public(db, role, skill, terms, stage, q, sort, limit, offset)
    return Page(items=[service.to_card(s) for s in rows], total=total, limit=limit, offset=offset)


@router.post("/startups", response_model=StartupDetail, status_code=201)
async def create_startup(data: StartupIn, user: CurrentUser, db: DbSession) -> StartupDetail:
    s = await service.create(db, user, data)
    return await service.to_detail(db, s, user)


@router.get("/startups/{slug}", response_model=StartupDetail)
async def get_startup(slug: str, user: OptionalUser, db: DbSession) -> StartupDetail:
    s = await service.get_by_slug(db, slug, user)
    return await service.to_detail(db, s, user)


@router.patch("/startups/{startup_id}", response_model=StartupDetail)
async def update_startup(
    startup_id: uuid.UUID, data: StartupUpdate, user: CurrentUser, db: DbSession
) -> StartupDetail:
    s = await service.get_owned(db, startup_id, user)
    await service.update(db, s, data)
    return await service.to_detail(db, s, user)


@router.post("/startups/{startup_id}/publish", response_model=StartupDetail)
async def publish_startup(startup_id: uuid.UUID, user: CurrentUser, db: DbSession) -> StartupDetail:
    s = await service.get_owned(db, startup_id, user)
    await service.publish(db, user, s)
    return await service.to_detail(db, s, user)


@router.post("/startups/{startup_id}/close", response_model=StartupDetail)
async def close_startup(startup_id: uuid.UUID, user: CurrentUser, db: DbSession) -> StartupDetail:
    s = await service.get_owned(db, startup_id, user)
    await service.set_status(db, s, StartupStatus.closed)
    return await service.to_detail(db, s, user)


@router.post("/startups/{startup_id}/archive", response_model=StartupDetail)
async def archive_startup(startup_id: uuid.UUID, user: CurrentUser, db: DbSession) -> StartupDetail:
    s = await service.get_owned(db, startup_id, user)
    await service.set_status(db, s, StartupStatus.archived)
    return await service.to_detail(db, s, user)


@router.post("/startups/{startup_id}/roles", response_model=StartupDetail, status_code=201)
async def add_startup_role(
    startup_id: uuid.UUID, data: RoleIn, user: CurrentUser, db: DbSession
) -> StartupDetail:
    s = await service.get_owned(db, startup_id, user)
    await service.add_role(db, s, data)
    return await service.to_detail(db, s, user)


@router.patch("/startup-roles/{role_id}", response_model=StartupDetail)
async def update_startup_role(
    role_id: uuid.UUID, data: RoleUpdate, user: CurrentUser, db: DbSession
) -> StartupDetail:
    r = await service.get_owned_role(db, role_id, user)
    await service.update_role(db, r, data)
    return await service.to_detail(db, r.startup, user)


@router.delete("/startup-roles/{role_id}", response_model=OkOut)
async def delete_startup_role(role_id: uuid.UUID, user: CurrentUser, db: DbSession) -> OkOut:
    r = await service.get_owned_role(db, role_id, user)
    await service.delete_role(db, r)
    return OkOut()


@router.get("/me/startups", response_model=list[MyStartupOut])
async def list_my_startups(user: CurrentUser, db: DbSession) -> list[MyStartupOut]:
    return await service.my_startups(db, user)


@router.get("/me/recommended-startups", response_model=list[RecommendedStartup])
async def list_recommended_startups(user: CurrentUser, db: DbSession) -> list[RecommendedStartup]:
    return await service.recommended(db, user)


@router.get("/startups/{startup_id}/applications", response_model=list[ApplicationOut])
async def list_startup_applications(
    startup_id: uuid.UUID, user: CurrentUser, db: DbSession, status: str | None = None
) -> list[ApplicationOut]:
    s = await service.get_owned(db, startup_id, user)
    return [app_service.to_out(a, user) for a in await app_service.for_startup(db, s, status)]
