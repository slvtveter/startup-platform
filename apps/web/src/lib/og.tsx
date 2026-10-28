import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// OG-картинки (KAN-77): превью ссылки в Telegram и соцсетях в стиле v3 «Разговор»:
// слева крупный текст, справа фото с репликой (главная) или плитка проекта/человека.
export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#0F1B2D";
const MUTED = "#5A6478";
const BRAND = "#3B6FE4";
const CORNFLOWER = "#5B8CF0";
const TONE = "#F4F6FA";
const SOFT = "#E8EFFD";
const FONT = "ManCyr, ManLat";

const ASSETS = join(process.cwd(), "assets");

async function fonts() {
  const load = (file: string) => readFile(join(ASSETS, "og-fonts", file));
  const [cyr6, lat6, cyr8, lat8] = await Promise.all([
    load("manrope-cyrillic-600-normal.woff"),
    load("manrope-latin-600-normal.woff"),
    load("manrope-cyrillic-800-normal.woff"),
    load("manrope-latin-800-normal.woff"),
  ]);
  return [
    // Сабсеты под разными именами: satori ищет недостающий глиф по списку семейств в fontFamily.
    { name: "ManLat", data: lat6, weight: 600 as const },
    { name: "ManCyr", data: cyr6, weight: 600 as const },
    { name: "ManLat", data: lat8, weight: 800 as const },
    { name: "ManCyr", data: cyr8, weight: 800 as const },
  ];
}

/** Картинка из assets/og как data URL: satori не ходит в сеть и не понимает WebP. */
async function asset(file: string) {
  return `data:image/jpeg;base64,${(await readFile(join(ASSETS, "og", file))).toString("base64")}`;
}

/** Знак «e в круге» — тот же, что в шапке сайта. */
function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="29" fill={CORNFLOWER} />
      <path d="M17 33 H45 A14 14 0 1 0 40.7 43.2" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="47.5" cy="17.5" r="4.6" fill="#fff" />
    </svg>
  );
}

function Chip({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 52,
        padding: "0 22px",
        borderRadius: 26,
        fontSize: 24,
        background: accent ? SOFT : TONE,
        color: accent ? BRAND : INK,
        fontWeight: accent ? 800 : 600,
      }}
    >
      {children}
    </div>
  );
}

/** Справа: фото с репликой (главная) или крупная плитка с буквой/инициалами. */
type Aside =
  | { kind: "photo" }
  | { kind: "tile"; letter: string; caption: string; round?: boolean };

/** Каркас: логотип, заголовок, подзаголовок, чипы снизу; справа — Aside. */
export async function ogImage({
  eyebrow,
  title,
  subtitle,
  chips = [],
  aside,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  chips?: { text: string; accent?: boolean }[];
  aside: Aside;
}) {
  const [photo, face] = aside.kind === "photo" ? await Promise.all([asset("home.jpg"), asset("face.jpg")]) : [null, null];
  const long = title.length > 28;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "white", padding: 48, fontFamily: FONT, fontWeight: 600, color: INK }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 40px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 32, fontWeight: 800, letterSpacing: -1.2 }}>
            <Mark size={40} />
            envola
          </div>
          {eyebrow && <div style={{ marginTop: 48, fontSize: 24, fontWeight: 800, color: BRAND, letterSpacing: 0.5 }}>{eyebrow}</div>}
          <div
            style={{
              marginTop: eyebrow ? 12 : 56,
              fontWeight: 800,
              letterSpacing: long ? -2 : -2.6,
              fontSize: long ? 56 : 68,
              lineHeight: 1.04,
              display: "flex",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ marginTop: 20, fontSize: 28, color: MUTED, lineHeight: 1.35, display: "flex" }}>
              {subtitle.length > 110 ? `${subtitle.slice(0, 108)}…` : subtitle}
            </div>
          )}
          {chips.length > 0 && (
            <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: 10 }}>
              {chips.slice(0, 4).map((c) => (
                <Chip key={c.text} accent={c.accent}>
                  {c.text}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {aside.kind === "photo" ? (
          <div style={{ width: 470, height: 534, position: "relative", display: "flex", borderRadius: 36, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori рисует только <img> */}
            <img src={photo!} width={470} height={534} style={{ objectFit: "cover" }} alt="" />
            <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(180deg, rgba(10,18,34,0) 45%, rgba(10,18,34,0.55) 100%)" }} />
            <div style={{ position: "absolute", left: 28, right: 28, bottom: 28, display: "flex", alignItems: "flex-end", gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- satori рисует только <img> */}
              <img src={face!} width={56} height={56} style={{ borderRadius: 28, border: "3px solid white" }} alt="" />
              <div style={{ display: "flex", flexDirection: "column", background: "white", borderRadius: 24, borderBottomLeftRadius: 8, padding: "14px 20px", fontSize: 22, lineHeight: 1.3, maxWidth: 330 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: MUTED }}>Кирилл, frontend</span>
                <span style={{ marginTop: 4 }}>Видел твою идею, могу взять фронт. Созвонимся?</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: 470,
              height: 534,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 36,
              background: `linear-gradient(150deg, ${SOFT} 0%, #DCE6FC 100%)`,
            }}
          >
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: aside.round ? 110 : 56,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: aside.letter.length > 1 ? 92 : 120,
                fontWeight: 800,
                color: BRAND,
                letterSpacing: -4,
                boxShadow: "0 24px 60px rgba(15,27,45,0.12)",
              }}
            >
              {aside.letter}
            </div>
            <div style={{ marginTop: 36, fontSize: 26, fontWeight: 800, color: INK, display: "flex", textAlign: "center", padding: "0 32px" }}>{aside.caption}</div>
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
