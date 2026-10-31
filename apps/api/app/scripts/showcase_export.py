# ruff: noqa: E501 — строки-комментарии генерируемого файла читаются лучше целиком
"""Витрина главной (apps/web/src/lib/showcase.ts + public/showcase/*.webp) из демо-набора.

Запуск при поднятом локальном стеке с загруженными примерами:
  docker compose -f infra/docker-compose.yml exec api python -m app.scripts.demo reset
  cd apps/api && PYTHONPATH=. uv run python -m app.scripts.showcase_export
Данные берутся из локального API (те же поля, что у карточек), фото — из demo_media, пережимаются в WebP 384 px.
"""

import json
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

from app.scripts.demo_data import FOUNDERS, PEOPLE, STARTUPS

API = "http://localhost:8080/api"
ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / "apps/web/public/showcase"
WEB = ROOT / "apps/web/src/lib/showcase.data.ts"
MEDIA = Path(__file__).parent / "demo_media"


def get(u: str):
    return json.load(urllib.request.urlopen(API + u))


startups = [s for s in get("/startups?limit=100")["items"] if s["is_demo"]]
people = [p for p in get("/people?limit=100")["items"] if p["is_demo"]]
by_name = {p.name: p.key for p in [*PEOPLE, *FOUNDERS]}
by_title = {s.title: s.key for s in STARTUPS}


def img(src, key, size):
    o = OUT / f"{key}.webp"
    if not o.exists():
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        im = ImageOps.fit(im, (size, size))
        im.save(o, "WEBP", quality=80)
    return f"/showcase/{key}.webp"


def person_photo(name):
    k = by_name.get(name)
    return (
        img(MEDIA / "people" / f"{k}.jpg", k, 384)
        if k and (MEDIA / "people" / f"{k}.jpg").exists()
        else None
    )


for s in startups:
    k = by_title[s["title"]]
    s["cover_url"] = s["cover_url_lg"] = img(MEDIA / "covers" / f"{k}.jpg", "c-" + k, 384)
    s["owner_avatar_url"] = person_photo(s["owner_name"]) if s.get("owner_avatar_url") else None
    s["is_demo"] = False
for p in people:
    u = person_photo(p["display_name"])
    p["avatar_url"] = u
    p["avatar_url_lg"] = u
    p["is_demo"] = False
ideas = [s for s in startups if s["stage"] == "idea"]
live = [s for s in startups if s["stage"] != "idea"]
data = {"STARTUPS": live, "IDEAS": ideas, "PEOPLE": [p for p in people if p["avatar_url"]]}
src = [
    "/**",
    " * Витрина главной: придуманные стартапы и люди, не связанные с базой (не меняются от новых регистраций).",
    " * Сгенерировано app/scripts/showcase_export.py из demo_data.py, фото — Pexels (бесплатная лицензия) в public/showcase.",
    " * Карточки ведут не на страницы (их нет), а в каталог по роли — выбор карточек и ссылки — в showcase.ts.",
    " */",
    'import type { PersonCard, StartupCard } from "@/lib/api";',
    "",
]
for k, v in data.items():
    t = "StartupCard" if k != "PEOPLE" else "PersonCard"
    src.append(f"export const {k}: {t}[] = {json.dumps(v, ensure_ascii=False, indent=2)};\n")
WEB.write_text("\n".join(src))
print(len(live), len(ideas), len(data["PEOPLE"]))
