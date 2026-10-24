from pydantic import BaseModel, Field


class EmailPrefOut(BaseModel):
    kind: str
    label: str
    enabled: bool


class EmailPrefsIn(BaseModel):
    prefs: dict[str, bool] = Field(description="Тип уведомления → присылать ли письма")


class UnsubscribeIn(BaseModel):
    u: str = Field(max_length=64)
    k: str = Field(max_length=32)
    t: str = Field(max_length=64)


class UnsubscribeOut(BaseModel):
    label: str
