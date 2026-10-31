import urllib.parse
from typing import Annotated, Literal

from fastapi import APIRouter, Query, UploadFile
from fastapi.responses import FileResponse

from app.core.deps import CurrentUser, OptionalUser
from app.db.session import DbSession
from app.schemas.common import Page
from app.schemas.profile import MyProfileOut, PersonCard, PersonDetail, ProfileUpdate, PublishIn
from app.services import avatars, resumes
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


@router.post("/profile/me/resume", response_model=MyProfileOut)
async def upload_my_resume(file: UploadFile, user: CurrentUser, db: DbSession) -> MyProfileOut:
    data = await file.read(resumes.MAX_BYTES + 1)
    await resumes.upload(db, user.profile, data, file.filename or "")
    return await service.my_profile(db, user)


@router.delete("/profile/me/resume", response_model=MyProfileOut)
async def delete_my_resume(user: CurrentUser, db: DbSession) -> MyProfileOut:
    await resumes.remove(db, user.profile)
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
    sort: Literal["new", "experience"] = "new",
    limit: Annotated[int, Query(ge=1, le=100)] = 24,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[PersonCard]:
    """looking_for — условия (любое из); cofound — только ищущие сообщников, вместе с условиями."""
    rows, total = await service.list_people(
        db, role, skill, level, looking_for, q, limit, offset, cofound=cofound, sort=sort
    )
    return Page(items=[service.to_card(p) for p in rows], total=total, limit=limit, offset=offset)


@router.get("/people/{slug}", response_model=PersonDetail)
async def get_person(slug: str, user: OptionalUser, db: DbSession) -> PersonDetail:
    return await service.to_detail(db, await service.get_public(db, slug, user))


@router.get("/people/{slug}/resume", response_class=FileResponse)
async def get_resume(slug: str, user: CurrentUser, db: DbSession) -> FileResponse:
    """Резюме видят только вошедшие: гостям и поисковикам файл не отдаём."""
    if user.profile is not None and user.profile.slug == slug:
        p = user.profile
    else:
        p = await service.get_public(db, slug, user)
    name = p.resume_name or "Резюме.pdf"
    return FileResponse(
        resumes.path_of(p),
        media_type="application/pdf",
        headers={
            # inline: PDF открывается во вкладке браузера; имя — для «Сохранить как».
            "Content-Disposition": f"inline; filename*=UTF-8''{urllib.parse.quote(name)}",
            "Cache-Control": "private, no-store",
            "X-Robots-Tag": "noindex",
        },
    )
