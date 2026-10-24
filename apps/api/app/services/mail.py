import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

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


async def send_mail(to: str, subject: str, body: str) -> None:
    s = get_settings()
    msg = EmailMessage()
    msg["From"] = s.mail_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    if s.mail_backend == "memory":
        outbox.append(msg)
        return
    try:
        await asyncio.to_thread(_send_smtp, msg)
    except Exception:
        # Письмо не должно ронять запрос пользователя.
        logger.exception("mail send failed")


def link(path: str) -> str:
    return get_settings().site_url.rstrip("/") + path
