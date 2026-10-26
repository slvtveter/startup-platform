"""Значения перечислений. В БД храним строками (native_enum=False) — проще мигрировать."""

from enum import StrEnum


class ExperienceLevel(StrEnum):
    no_experience = "no_experience"
    courses = "courses"
    internship = "internship"
    junior = "junior"


class Availability(StrEnum):
    few_hours = "few_hours"
    part_time = "part_time"
    full_time = "full_time"


class Terms(StrEnum):
    free = "free"
    paid = "paid"
    negotiable = "negotiable"  # условия обсуждаются; «за долю» убрали (KAN-138)


class Stage(StrEnum):
    idea = "idea"
    prototype = "prototype"
    mvp = "mvp"
    launched = "launched"


class StartupStatus(StrEnum):
    draft = "draft"
    recruiting = "recruiting"
    closed = "closed"
    archived = "archived"


class ApplicationDirection(StrEnum):
    apply = "apply"
    invite = "invite"


class ApplicationStatus(StrEnum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"


class TokenPurpose(StrEnum):
    verify_email = "verify_email"
    reset_password = "reset_password"
    change_email = "change_email"


class LinkKind(StrEnum):
    portfolio = "portfolio"
    github = "github"
    behance = "behance"
    linkedin = "linkedin"
    other = "other"


class ReportReason(StrEnum):
    spam = "spam"
    fake = "fake"
    offensive = "offensive"
    scam = "scam"
    other = "other"


class ReportStatus(StrEnum):
    new = "new"
    resolved = "resolved"
    dismissed = "dismissed"
