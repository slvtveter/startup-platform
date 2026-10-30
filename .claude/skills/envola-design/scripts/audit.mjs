#!/usr/bin/env node
// Машинный аудит страницы Envola против дизайн-системы и базовой доступности, на 1440 и 390.
//
//   node audit.mjs http://localhost:3000/people
//   node audit.mjs https://envola.ru/ https://envola.ru/startups --json
//   флаги: --cookie "name=value" (залогиненные страницы), --selector "main article" (проверять только внутри)
//
// Проверяет: кегли и радиусы вне шкалы, цвета текста и фона вне токенов globals.css, горизонтальный скролл,
// тап-зоны < 24 px на телефоне, картинки без alt, один h1 и порядок заголовков, число залитых CTA
// в первом экране, ошибки консоли, axe-core (WCAG 2.2 AA). Код выхода 1, если есть ошибки (fail).
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CACHE_DIR, REPO_ROOT, loadPlaywright, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const urls = args._;
if (!urls.length) {
  console.error("Пример: node audit.mjs http://localhost:3000/people");
  process.exit(1);
}

const FONT_SCALE = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 56, 64];
const RADIUS_SCALE = [2, 4, 6, 8, 12, 16, 20, 28, 36]; // 2–6: мелочи shadcn (чекбокс, тултип)

// Токены цвета берём из globals.css, чтобы аудит не разъезжался с системой.
const css = readFileSync(join(REPO_ROOT, "apps/web/src/app/globals.css"), "utf8");
// именно блок «:root {» (строка «.dark» встречается раньше, в @custom-variant)
const rootStart = css.search(/^:root\s*\{/m);
const root = css.slice(rootStart, css.indexOf("\n}", rootStart));
if (rootStart < 0 || !root.includes("--foreground")) throw new Error("Не нашёл блок :root в globals.css — поправь парсер токенов в audit.mjs");
const hex = (h) => {
  h = h.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const TOKENS = new Map();
for (const m of root.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\b/g)) TOKENS.set(hex(m[2]).join(","), m[1]);
TOKENS.set("255,255,255", "white");
TOKENS.set("0,0,0", "black");

function nearToken(rgb) {
  // rgb из computed style; прозрачность учитываем как «производный» цвет и не ругаемся
  const m = rgb.match(/rgba?\(([^)]+)\)/);
  if (!m) return { ok: true };
  const [r, g, b, a = 1] = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (a < 1) return { ok: true };
  let best = null, dist = Infinity;
  for (const [k, name] of TOKENS) {
    const [tr, tg, tb] = k.split(",").map(Number);
    const d = Math.hypot(r - tr, g - tg, b - tb);
    if (d < dist) (dist = d), (best = name);
  }
  return { ok: dist <= 6, best, dist: Math.round(dist), value: `rgb(${r},${g},${b})` };
}

function inPage({ selector, mobile }) {
  const scope = selector ? [...document.querySelectorAll(selector)] : [document.body];
  const els = scope.flatMap((s) => [s, ...s.querySelectorAll("*")]).slice(0, 12000);
  const out = { fonts: [], radii: [], colors: [], bgs: [], taps: [], imgs: [], ctas: 0 };
  const label = (el) => {
    const t = (el.innerText || el.getAttribute("aria-label") || el.alt || "").trim().replace(/\s+/g, " ").slice(0, 40);
    const cls = typeof el.className === "string" ? el.className.split(" ").slice(0, 3).join(".") : "";
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${t ? ` «${t}»` : ""}`;
  };
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) continue;
    if (el.closest("[aria-hidden=true], svg, .sr-only")) continue;
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (text) {
      out.fonts.push({ v: parseFloat(s.fontSize), el: label(el) });
      out.colors.push({ v: s.color, el: label(el) });
    }
    const rad = parseFloat(s.borderTopLeftRadius);
    if (rad > 0 && !s.borderTopLeftRadius.includes("%")) out.radii.push({ v: rad, w: r.width, h: r.height, el: label(el) });
    if (s.backgroundColor !== "rgba(0, 0, 0, 0)" && r.width > 40) out.bgs.push({ v: s.backgroundColor, el: label(el) });
    const interactive = el.matches("a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary");
    if (interactive && mobile) {
      // WCAG 2.5.8: цель не меньше 24×24, если рядом нет запаса. Строчные ссылки в абзаце — исключение.
      const inline = el.tagName === "A" && s.display === "inline" && el.closest("p, li, dd");
      if (!inline && (r.width < 24 || r.height < 24)) out.taps.push({ el: label(el), w: Math.round(r.width), h: Math.round(r.height) });
    }
    if (el.tagName === "IMG" && !el.hasAttribute("alt")) out.imgs.push(label(el));
    if ((el.tagName === "A" || el.tagName === "BUTTON") && r.top < innerHeight && r.bottom > 0 && r.height >= 36 && s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "rgb(255, 255, 255)") out.ctas++;
  }
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => h.getBoundingClientRect().height);
  out.h1 = hs.filter((h) => h.tagName === "H1").length;
  out.headingSkips = [];
  for (let i = 1; i < hs.length; i++) {
    const a = Number(hs[i - 1].tagName[1]), b = Number(hs[i].tagName[1]);
    if (b > a + 1) out.headingSkips.push(`${hs[i - 1].tagName} → ${hs[i].tagName} «${hs[i].innerText.slice(0, 30)}»`);
  }
  out.overflow = document.documentElement.scrollWidth - innerWidth;
  return out;
}

function group(items, bad) {
  const m = new Map();
  for (const it of items) {
    const k = bad(it);
    if (!k) continue;
    if (!m.has(k)) m.set(k, { n: 0, samples: [] });
    const g = m.get(k);
    g.n++;
    if (g.samples.length < 3 && !g.samples.includes(it.el)) g.samples.push(it.el);
  }
  return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
}

const { chromium } = loadPlaywright();
let AxeBuilder = null;
try {
  AxeBuilder = createRequire(join(REPO_ROOT, "apps/web/package.json"))("@axe-core/playwright").default;
} catch {}

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const report = [];
let fails = 0;

for (const url of urls) {
  for (const vp of [{ name: "1440", width: 1440, height: 900 }, { name: "390", width: 390, height: 844, mobile: true }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, locale: "ru-RU" });
    if (args.cookie) {
      const [name, ...v] = String(args.cookie).split("=");
      await ctx.addCookies([{ name, value: v.join("="), url }]);
    }
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 160)));
    page.on("pageerror", (e) => consoleErrors.push(String(e.message).slice(0, 160)));
    const failed = [];
    page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, "").slice(0, 90)}`));
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch((e) => consoleErrors.push(`goto: ${e.message.split("\n")[0]}`));
    const status = resp?.status?.() ?? 0;
    await page.waitForTimeout(600);
    const d = await page.evaluate(inPage, { selector: args.selector || null, mobile: !!vp.mobile });
    const issues = [];
    const add = (level, what, detail) => {
      issues.push({ level, what, detail });
      if (level === "fail") fails++;
    };

    for (const [k, g] of group(d.fonts, (f) => (FONT_SCALE.some((s) => Math.abs(s - f.v) < 0.6) ? null : `${f.v}px`)))
      add(g.n > 2 ? "warn" : "info", `кегль ${k} вне шкалы ×${g.n}`, g.samples.join("; "));
    for (const [k, g] of group(d.radii, (r) => {
      const pill = r.v >= Math.min(r.w, r.h) / 2 - 1 || r.v >= 999;
      return pill || RADIUS_SCALE.some((s) => Math.abs(s - r.v) < 0.6) ? null : `${r.v}px`;
    }))
      add("warn", `радиус ${k} вне шкалы ×${g.n}`, g.samples.join("; "));
    for (const [k, g] of group(d.colors, (c) => { const t = nearToken(c.v); return t.ok ? null : `${t.value} (ближе всего ${t.best}, Δ${t.dist})`; }))
      add("warn", `цвет текста ${k} не токен ×${g.n}`, g.samples.join("; "));
    for (const [k, g] of group(d.bgs, (c) => { const t = nearToken(c.v); return t.ok ? null : `${t.value} (ближе всего ${t.best}, Δ${t.dist})`; }))
      add("warn", `фон ${k} не токен ×${g.n}`, g.samples.join("; "));
    if (status >= 400 || !status) {
      add("fail", `страница ответила ${status || "ошибкой"}`, "остальные проверки бессмысленны");
      report.push({ url, viewport: vp.name, issues });
      await ctx.close();
      continue;
    }
    if (d.overflow > 1) add("fail", `горизонтальный скролл ${d.overflow}px`, "");
    if (d.taps.length) add("fail", `тап-зоны меньше 24px ×${d.taps.length}`, d.taps.slice(0, 4).map((t) => `${t.el} ${t.w}×${t.h}`).join("; "));
    if (d.imgs.length) add("fail", `img без alt ×${d.imgs.length}`, d.imgs.slice(0, 3).join("; "));
    if (!args.selector && d.h1 !== 1) add("warn", `h1 на странице: ${d.h1}`, "");
    if (d.headingSkips.length) add("warn", "пропуск уровня заголовка", d.headingSkips.slice(0, 3).join("; "));
    if (!args.selector && d.ctas > 3) add("warn", `залитых кнопок в первом экране: ${d.ctas}`, "одно главное действие на экран");
    if (failed.length) add("warn", `упавшие запросы ×${failed.length}`, [...new Set(failed)].slice(0, 4).join(" | "));
    if (consoleErrors.length) add("warn", `ошибки консоли ×${consoleErrors.length}`, consoleErrors.slice(0, 3).join(" | "));
    if (AxeBuilder) {
      let axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]);
      if (args.selector) axe = axe.include(args.selector);
      const res = await axe.analyze().catch(() => null);
      for (const v of res?.violations ?? [])
        add(["critical", "serious"].includes(v.impact) ? "fail" : "warn", `axe ${v.id} (${v.impact}) ×${v.nodes.length}`, `${v.help}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join("; ")}`);
    }
    report.push({ url, viewport: vp.name, issues });
    await ctx.close();
  }
}
await browser.close();

mkdirSync(join(CACHE_DIR, "audits"), { recursive: true });
const file = join(CACHE_DIR, "audits", `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(file, JSON.stringify(report, null, 2));
if (args.json) console.log(JSON.stringify(report, null, 2));
else {
  const icon = { fail: "✗", warn: "!", info: "·" };
  for (const r of report) {
    console.log(`\n## ${r.url} @ ${r.viewport}`);
    if (!r.issues.length) console.log("  чисто");
    for (const i of r.issues) console.log(`  ${icon[i.level]} ${i.what}${i.detail ? `\n      ${i.detail}` : ""}`);
  }
  console.log(`\nОшибок: ${fails}. Отчёт: ${file}`);
}
process.exit(fails ? 1 : 0);
