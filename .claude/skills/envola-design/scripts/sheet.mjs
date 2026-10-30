#!/usr/bin/env node
// Сводный лист: несколько снимков в одной картинке, чтобы сравнить приёмы бок о бок
// (и чтобы смотреть один файл вместо двадцати).
//
//   node sheet.mjs --tag person-card --page people --view d-first
//   node sheet.mjs --site hh,habr-career,envola --page catalog --view d-full --crop 2200
//   node sheet.mjs --images a.png,b.png,c.png --labels "A,B,C" --name variants-card
//   флаги: --cols 3, --width 1800 (ширина листа), --name <файл>
// Результат: .cache/sheets/<name>.jpg
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CACHE_DIR, CAPTURES_DIR, list, loadLibrary, loadPlaywright, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const view = args.view || "d-first";
const cells = [];

if (args.images) {
  const labels = list(args.labels);
  list(args.images).forEach((p, i) => cells.push({ label: labels[i] || p.split("/").pop(), file: resolve(p) }));
} else {
  const lib = loadLibrary();
  const ids = list(args.site), tags = list(args.tag), keys = list(args.page);
  for (const s of lib.sites) {
    if (!(ids.includes(s.id) || (tags.length && s.tags.some((t) => tags.includes(t))))) continue;
    for (const p of s.pages) {
      if (keys.length && !keys.includes(p.key)) continue;
      const file = join(CAPTURES_DIR, s.id, p.key, `${view}.jpg`);
      const metaFile = join(CAPTURES_DIR, s.id, p.key, "meta.json");
      if (!existsSync(file) || !existsSync(metaFile) || !JSON.parse(readFileSync(metaFile, "utf8")).ok) continue;
      cells.push({ label: `${s.name} · ${p.key}${s.antipattern ? " · антипример" : ""}`, file });
    }
  }
}
if (!cells.length) {
  console.error("Нет снимков. Сначала capture.mjs с теми же --site/--tag.");
  process.exit(1);
}

const mobile = view.startsWith("m-");
const cols = Number(args.cols || (mobile ? 5 : 3));
const width = Number(args.width || 1800);
const crop = Number(args.crop || (view === "d-full" ? 2400 : 0));
const name = args.name || `${list(args.tag).join("+") || list(args.site).join("+") || "sheet"}-${args.page || "all"}-${view}`;
const dir = join(CACHE_DIR, "sheets");
mkdirSync(dir, { recursive: true });
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:24px;background:#e9ebf0;font:600 15px/1.3 -apple-system,system-ui,sans-serif;color:#0f1b2d;width:${width}px;box-sizing:border-box}
.g{display:grid;align-items:start;grid-template-columns:repeat(${cols},1fr);gap:20px}
figure{margin:0;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.12)}
figcaption{padding:8px 12px;border-bottom:1px solid #e3e6ec}
.i{${crop ? `max-height:${Math.round((crop * (width / cols)) / 1440)}px;` : ""}overflow:hidden}
img{display:block;width:100%}
</style><div class="g">${cells
  .map((c, i) => `<figure><figcaption>${i + 1}. ${c.label}</figcaption><div class="i"><img src="${pathToFileURL(c.file)}"></div></figure>`)
  .join("")}</div>`;
const htmlFile = join(dir, `${name}.html`);
writeFileSync(htmlFile, html);

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(pathToFileURL(htmlFile).href);
await page.waitForLoadState("load");
const out = join(dir, `${name}.jpg`);
await page.screenshot({ path: out, fullPage: true, type: "jpeg", quality: 80 });
await browser.close();
console.log(out);
