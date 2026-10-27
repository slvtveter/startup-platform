import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// OG-картинки (KAN-77): превью ссылки в Telegram и соцсетях в стиле дизайн-системы v2.
export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#0F1B2D";
const MUTED = "#5A6478";
const CORNFLOWER = "#5B8CF0";
const SOFT = "#ECF1FE";
const FONT = "ManCyr, ManLat";

async function fonts() {
  const dir = join(process.cwd(), "assets", "og-fonts");
  const load = (file: string) => readFile(join(dir, file));
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

function SeatBox({ filled, label }: { filled: boolean; label?: string }) {
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        marginLeft: -10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 800,
        color: "white",
        background: filled ? INK : SOFT,
        border: filled ? "4px solid white" : `3px dashed ${CORNFLOWER}`,
      }}
    >
      {label}
    </div>
  );
}

/** Карточка: заголовок, подзаголовок, ряд мест и подпись снизу. */
export async function ogImage({
  title,
  subtitle,
  filled,
  open,
  footer,
  initials,
}: {
  title: string;
  subtitle: string;
  filled: number;
  open: number;
  footer: string;
  initials?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "white",
          padding: 72,
          fontFamily: FONT,
          fontWeight: 600,
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 34, fontWeight: 800, letterSpacing: -1.5 }}>
          <Mark size={40} />
          envola
        </div>
        <div style={{ marginTop: 64, fontWeight: 800, letterSpacing: -3, fontSize: title.length > 24 ? 72 : 88, lineHeight: 1.04 }}>
          {title}
        </div>
        <div style={{ marginTop: 20, fontSize: 36, color: MUTED, lineHeight: 1.3 }}>{subtitle}</div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", paddingLeft: 10 }}>
          {Array.from({ length: Math.min(filled, 5) }, (_, i) => (
            <SeatBox key={`f${i}`} filled label={i === 0 ? initials : undefined} />
          ))}
          {Array.from({ length: Math.min(open, 5) }, (_, i) => (
            <SeatBox key={`o${i}`} filled={false} />
          ))}
          <div style={{ marginLeft: 24, fontSize: 32 }}>{footer}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
