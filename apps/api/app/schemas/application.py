from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ApplicationDirection, ApplicationStatus
from app.schemas.profile import PersonCard


class ApplyIn(BaseModel):
    message: str = Field(min_length=30, max_length=1000)


class InviteIn(BaseModel):
    startup_role_id: str
    message: str = Field(min_length=10, max_length=1000)


class DecisionIn(BaseModel):
    note: str = Field(default="", max_length=300)


class ContactsOut(BaseModel):
    display_name: str
    email: str | None
    telegram: str | None


class ApplicationOut(BaseModel):
    id: str
    direction: ApplicationDirection
    status: ApplicationStatus
    message: str
    decision_note: str
    created_at: datetime
    decided_at: datetime | None
    startup_slug: str
    startup_title: str
    role_id: str
    role_title: str
    applicant: PersonCard | None
    # Контакты другой стороны: только после взаимного согласия.
    contacts: ContactsOut | None
    can_decide: bool
    can_withdraw: bool
