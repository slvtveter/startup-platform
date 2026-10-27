import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// OG-картинки (KAN-77): превью ссылки в Telegram и соцсетях в стиле дизайн-системы v2.
export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#0F1B2D";
const MUTED = "#5A6478";
const MARKER = "#5B8CF0";
const TEXT = "GolosCyr, GolosLat";
const DISPLAY = "UnbCyr, UnbLat";

async function fonts() {
  const dir = join(process.cwd(), "assets", "og-fonts");
  const load = (file: string) => readFile(join(dir, file));
  const [golosCyr, golosLat, unbCyr, unbLat] = await Promise.all([
    load("golos-text-cyrillic-600-normal.woff"),
    load("golos-text-latin-600-normal.woff"),
    load("unbounded-cyrillic-600-normal.woff"),
    load("unbounded-latin-600-normal.woff"),
  ]);
  return [
    // Сабсеты под разными именами: satori ищет недостающий глиф по списку семейств в fontFamily.
    { name: "GolosLat", data: golosLat, weight: 600 as const },
    { name: "GolosCyr", data: golosCyr, weight: 600 as const },
    { name: "UnbLat", data: unbLat, weight: 600 as const },
    { name: "UnbCyr", data: unbCyr, weight: 600 as const },
  ];
}

function SeatBox({ filled, label }: { filled: boolean; label?: string }) {
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        color: "white",
        background: filled ? INK : MARKER,
        border: filled ? "none" : `3px dashed ${INK}`,
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
          fontFamily: TEXT,
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 28 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: INK }} />
          <div style={{ width: 18, height: 18, borderRadius: 5, background: INK }} />
          <div style={{ width: 18, height: 18, borderRadius: 5, background: MARKER, border: `2px dashed ${INK}` }} />
          <div style={{ marginLeft: 12, fontFamily: DISPLAY }}>envola</div>
        </div>
        <div style={{ marginTop: 64, fontFamily: DISPLAY, fontSize: title.length > 24 ? 64 : 84, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ marginTop: 20, fontSize: 36, color: MUTED, lineHeight: 1.3 }}>{subtitle}</div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {Array.from({ length: Math.min(filled, 5) }, (_, i) => (
            <SeatBox key={`f${i}`} filled label={i === 0 ? initials : undefined} />
          ))}
          {Array.from({ length: Math.min(open, 5) }, (_, i) => (
            <SeatBox key={`o${i}`} filled={false} />
          ))}
          <div style={{ marginLeft: 20, fontSize: 32 }}>{footer}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
