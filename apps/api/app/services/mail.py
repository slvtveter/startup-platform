import asyncio
import html
import json
import logging
import re
import smtplib
from email.message import EmailMessage
from pathlib import Path
from string import Template

from app.core.config import get_settings
from app.core.demo import is_demo_email
from app.db.session import SessionLocal
from app.models import User
from app.services import jobs, notifications

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


_URL = re.compile(r"https?://[^\s<]+")
# Шаблон в стиле сайта: только инлайн-стили, без картинок и пикселей отслеживания.
_TEMPLATE = Template((Path(__file__).parent.parent / "templates" / "email.html").read_text())


# Ссылка на отдельной строке («…по ссылке:\nURL» или «Ответить: URL») превращается в кнопку.
# Подпись — текст перед двоеточием или по адресу страницы.
_LINE_LINK = re.compile(r"(?:(?P<label>[^:\n]{1,40}):\s*)?(?P<url>https?://\S+)")
_LABELS = (
    ("/verify-email", "Подтвердить почту"),
    ("/confirm-email", "Подтвердить новый адрес"),
    ("/reset-password", "Задать новый пароль"),
    ("/me/applications", "Открыть мои заявки"),
    ("/me/startups", "Посмотреть отклики"),
    ("/startups", "Смотреть стартапы"),
)


_BUTTON_STYLE = (
    "display:inline-block;background:#3d3df5;color:#ffffff;text-decoration:none;"
    "font-weight:700;padding:12px 22px;border-radius:10px"
)


def _button(url: str, label: str | None) -> str:
    path = url.split("://", 1)[-1].partition("/")[2]
    label = label or next((t for p, t in _LABELS if ("/" + path).startswith(p)), "Открыть")
    u = html.escape(url, quote=True)
    return (
        f'<p style="margin:4px 0 12px"><a href="{u}" style="{_BUTTON_STYLE}">'
        f"{html.escape(label)}</a></p>"
        f'<p style="margin:0 0 16px;font-size:12px;color:#565b77;word-break:break-all">'
        f"Если кнопка не нажимается, скопируйте ссылку: "
        f'<a href="{u}" style="color:#565b77">{u}</a></p>'
    )


def _text(lines: list[str]) -> str:
    text = html.escape("\n".join(lines)).replace("\n", "<br>")
    text = _URL.sub(lambda m: f'<a href="{m[0]}" style="color:#2b2bc4">{m[0]}</a>', text)
    return f'<p style="margin:0 0 16px">{text}</p>'


def _html(subject: str, body: str, unsubscribe: str | None) -> str:
    """HTML-версия письма (KAN-74). Текстовая версия остаётся как есть."""
    paragraphs = []
    site = get_settings().site_url.rstrip("/")
    for block in body.strip().split("\n\n"):
        pending: list[str] = []
        for line in block.split("\n"):
            m = _LINE_LINK.fullmatch(line.strip())
            if m and m["url"].startswith(site):
                if pending:
                    paragraphs.append(_text(pending))
                    pending = []
                paragraphs.append(_button(m["url"], m["label"]))
            else:
                pending.append(line)
        if pending:
            paragraphs.append(_text(pending))
    footer = (
        f'<a href="{html.escape(unsubscribe)}" style="color:#565b77">Отписаться от таких писем</a>'
        if unsubscribe
        else "Это служебное письмо, от него нельзя отписаться."
    )
    return _TEMPLATE.substitute(
        subject=html.escape(subject), paragraphs="\n".join(paragraphs), footer=footer
    )


def _message(to: str, subject: str, body: str, unsubscribe: str | None = None) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = get_settings().mail_from
    msg["To"] = to
    msg["Subject"] = subject
    text = body + (f"\n\nОтписаться от таких писем: {unsubscribe}" if unsubscribe else "")
    msg.set_content(text)
    msg.add_alternative(_html(subject, body, unsubscribe), subtype="html")
    if unsubscribe:
        msg["List-Unsubscribe"] = f"<{unsubscribe}>"
    # Unisender Go: не подменять ссылки и не вставлять пиксель открытия. Письма служебные,
    # а ссылки подтверждения и отписки должны вести прямо на сайт. Другие SMTP заголовок игнорируют.
    msg["X-UNISENDER-GO"] = json.dumps({"track_links": 0, "track_read": 0})
    return msg


async def send_mail(
    to: str, subject: str, body: str, *, user: User | None = None, kind: str | None = None
) -> None:
    """Поставить письмо в очередь (KAN-91): медленный или недоступный SMTP не тормозит запрос.

    kind — тип уведомления (notifications.KINDS): если получатель от него отписался, письма
    не будет, иначе в письмо добавится ссылка отписки. Без kind письмо служебное.
    В тестах (mail_backend=memory) письмо сразу попадает в outbox.
    """
    # Демо и вошедшие через Telegram/VK без почты: домен .invalid письма не принимает.
    if is_demo_email(to) or to.lower().endswith(".invalid"):
        return
    unsubscribe = None
    if kind is not None and user is not None:
        if not notifications.enabled(user, kind):
            return
        unsubscribe = notifications.unsubscribe_url(user.id, kind)
    payload = {"to": to, "subject": subject, "body": body, "unsubscribe": unsubscribe}
    if get_settings().mail_backend == "memory":
        outbox.append(_message(to, subject, body, unsubscribe))
        return
    async with SessionLocal() as db:
        jobs.enqueue(db, "send_mail", payload)
        await db.commit()


@jobs.handler("send_mail")
async def deliver(payload: dict) -> None:
    """Обработчик воркера: ошибка SMTP вызовет повтор задачи."""
    msg = _message(payload["to"], payload["subject"], payload["body"], payload.get("unsubscribe"))
    if get_settings().mail_backend == "memory":
        outbox.append(msg)
        return
    await asyncio.to_thread(_send_smtp, msg)


def link(path: str) -> str:
    return get_settings().site_url.rstrip("/") + path
