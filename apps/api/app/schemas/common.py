from pydantic import BaseModel, ConfigDict


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page[T](BaseModel):
    items: list[T]
    total: int
    limit: int
    offset: int


class OkOut(BaseModel):
    ok: bool = True
