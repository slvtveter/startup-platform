import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services import jobs

logger = logging.getLogger("app.mail")

# Для mail_backend=memory (тесты): все письма копятся здесь.
outbox: list[EmailMessage] = []


def _send_smtp(msg: EmailMessage) -> None:
    s = get_settings()
    with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=10) as smtp:
        if s.smtp_user:
            smtp.starttls()
            smtp.login(s.smtp_user, s.smtp_password)
        smtp.send_message(msg)


def _message(to: str, subject: str, body: str) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = get_settings().mail_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    return msg


async def send_mail(to: str, subject: str, body: str) -> None:
    """Поставить письмо в очередь (KAN-91): медленный или недоступный SMTP не тормозит запрос.

    В тестах (mail_backend=memory) письмо сразу попадает в outbox.
    """
    if get_settings().mail_backend == "memory":
        outbox.append(_message(to, subject, body))
        return
    async with SessionLocal() as db:
        jobs.enqueue(db, "send_mail", {"to": to, "subject": subject, "body": body})
        await db.commit()


@jobs.handler("send_mail")
async def deliver(payload: dict) -> None:
    """Обработчик воркера: ошибка SMTP вызовет повтор задачи."""
    msg = _message(payload["to"], payload["subject"], payload["body"])
    if get_settings().mail_backend == "memory":
        outbox.append(msg)
        return
    await asyncio.to_thread(_send_smtp, msg)


def link(path: str) -> str:
    return get_settings().site_url.rstrip("/") + path
