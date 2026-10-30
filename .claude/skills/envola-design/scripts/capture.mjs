#!/usr/bin/env node
// Снимает референсы (и наш сайт) в одном формате: первый экран 1440, длинный скрин 1440, первый экран 390,
// плюс замеры computed styles: кегли, шрифты, радиусы, фоны, число CTA в первом экране.
//
//   node capture.mjs --tag person-card            все сайты с тегом
//   node capture.mjs --site hh,habr-career        конкретные сайты
//   node capture.mjs --all                        вся библиотека
//   node capture.mjs --url http://localhost:3000/people --name local-people   любая страница
//   флаги: --page catalog (только страницы с этим key), --force (переснять), --no-full, --no-mobile,
//          --cookie "session=..." (залогиненные страницы: см. SKILL.md, «Вход для снимков»),
//          --media-from http://localhost:8080 (dev из worktree на другом порту: /media отдаёт только Caddy),
//          --retry-failed (только то, что не снялось), --headed (окно браузера: обходит часть антиботов, Cloudflare 403)
//
// Результат: .cache/captures/<site>/<page>/{d-first,d-full,m-first}.jpg + meta.json
import { mkdirSync, existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CAPTURES_DIR, list, loadLibrary, loadPlaywright, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const MAX_FULL = Number(args["max-height"] || 9000);
const STALE_DAYS = 30;

function targets() {
  if (args.url) return [{ site: args.name || "adhoc", page: { key: args.page || "page", url: args.url } }];
  const lib = loadLibrary();
  const ids = list(args.site);
  const tags = list(args.tag);
  const keys = list(args.page);
  const sites = lib.sites.filter(
    (s) => args.all || ids.includes(s.id) || (tags.length && s.tags.some((t) => tags.includes(t))),
  );
  if (!sites.length) {
    console.error("Ничего не выбрано: --site, --tag, --all или --url");
    process.exit(1);
  }
  return sites
    .flatMap((s) => s.pages.filter((p) => !keys.length || keys.includes(p.key)).map((page) => ({ site: s.id, page })))
    .filter((t) => !args["retry-failed"] || !fresh(join(CAPTURES_DIR, t.site, t.page.key)));
}

function fresh(dir) {
  const f = join(dir, "meta.json");
  if (!existsSync(f)) return false;
  const meta = JSON.parse(readFileSync(f, "utf8"));
  return meta.ok && (Date.now() - statSync(f).mtimeMs) / 864e5 < STALE_DAYS;
}

const CONSENT = /^(accept( all)?( cookies)?|allow all|agree|i agree|got it|ok|okay|принять( все)?|согласен|понятно|хорошо|ок|разрешить)$/i;

// «Принять» бывает и в самом интерфейсе (отклик, заявка) — жмём только внутри блока про cookie/согласие.
const inConsentBox = (b) =>
  b
    .evaluate((el) => {
      let n = el;
      for (let i = 0; i < 5 && n; i++, n = n.parentElement) {
        const t = n.innerText || "";
        if (t.length < 1500 && /cookie|куки|consent|согласи|privacy|конфиденциальн|персональн/i.test(t)) return true;
      }
      return false;
    })
    .catch(() => false);

async function dismissConsent(page) {
  for (const frame of page.frames()) {
    try {
      const buttons = await frame.locator("button, [role=button], a").all();
      for (const b of buttons.slice(0, 400)) {
        const t = ((await b.innerText({ timeout: 200 }).catch(() => "")) || "").trim();
        if (t.length < 30 && CONSENT.test(t) && (await b.isVisible().catch(() => false)) && (await inConsentBox(b))) {
          await b.click({ timeout: 1000 }).catch(() => {});
          await page.waitForTimeout(400);
          return true;
        }
      }
    } catch {}
  }
  return false;
}

async function settle(page) {
  // прокрутка будит lazy-картинки и анимации появления
  await page.evaluate(async (max) => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < Math.min(document.body.scrollHeight, max); y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  }, MAX_FULL);
  await page.waitForTimeout(700);
}

function metricsInPage() {
  const inc = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  const top = (m, n = 12) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  const sizes = new Map(), fams = new Map(), weights = new Map(), radii = new Map(), bgs = new Map(), colors = new Map();
  const vh = window.innerHeight;
  let ctas = 0;
  const nodes = [...document.querySelectorAll("body *")].slice(0, 8000);
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) continue;
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (text) {
      inc(sizes, s.fontSize);
      inc(fams, s.fontFamily.split(",")[0].replace(/["']/g, "").trim());
      inc(weights, s.fontWeight);
      inc(colors, s.color);
    }
    if (s.borderTopLeftRadius !== "0px") inc(radii, s.borderTopLeftRadius);
    if (s.backgroundColor !== "rgba(0, 0, 0, 0)") inc(bgs, s.backgroundColor);
    const tag = el.tagName;
    if ((tag === "A" || tag === "BUTTON") && r.top < vh && r.bottom > 0 && s.backgroundColor !== "rgba(0, 0, 0, 0)" && r.height >= 32) ctas++;
  }
  const h1 = document.querySelector("h1");
  const h1s = h1 ? getComputedStyle(h1) : null;
  return {
    title: document.title,
    h1: h1?.innerText.trim().slice(0, 200) || null,
    h1Style: h1s && { size: h1s.fontSize, weight: h1s.fontWeight, family: h1s.fontFamily.split(",")[0], letterSpacing: h1s.letterSpacing, lineHeight: h1s.lineHeight },
    bodyBg: getComputedStyle(document.body).backgroundColor,
    pageHeight: document.documentElement.scrollHeight,
    filledCtasInFirstScreen: ctas,
    distinctFontSizes: sizes.size,
    distinctRadii: radii.size,
    fontSizes: top(sizes, 16),
    fontFamilies: top(fams, 5),
    fontWeights: top(weights, 6),
    radii: top(radii, 10),
    backgrounds: top(bgs, 10),
    textColors: top(colors, 6),
  };
}

// Ищет на странице повторяющиеся карточки: родитель с ≥3 однотипными детьми заметного размера и с текстом.
// Помечает первые две атрибутом data-envola-card и возвращает их замеры и текст по строкам.
function findCards() {
  const sig = (el) =>
    el.tagName + "." + [...el.classList].filter((c) => !/active|selected|hover|\d{4,}/i.test(c)).slice(0, 2).join(".");
  let best = null;
  for (const parent of document.querySelectorAll("body *")) {
    if (parent.children.length < 3) continue;
    const groups = new Map();
    for (const ch of parent.children) {
      const k = sig(ch);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(ch);
    }
    for (const items of groups.values()) {
      if (items.length < 3) continue;
      const rects = items.slice(0, 8).map((e) => e.getBoundingClientRect());
      const top = rects[0].top + scrollY;
      const avgW = rects.reduce((s, r) => s + r.width, 0) / rects.length;
      const avgH = rects.reduce((s, r) => s + r.height, 0) / rects.length;
      const text = items.slice(0, 8).reduce((s, e) => s + (e.innerText || "").trim().length, 0) / Math.min(items.length, 8);
      if (avgW < 220 || avgH < 70 || avgH > 1100 || text < 30 || top > 7000) continue;
      if (items[0].closest("nav, header, footer")) continue;
      // секции страницы тоже идут однотипными соседями — отсекаем по h1/крупному h2 и высоте экрана
      const sectionLike = items.slice(0, 3).some(
        (e) => e.querySelector("h1") || [...e.querySelectorAll("h2")].some((h) => parseFloat(getComputedStyle(h).fontSize) > 30),
      );
      if (sectionLike || avgH > innerHeight * 0.85) continue;
      const score = Math.min(items.length, 8) * Math.min(avgW * avgH, 350000) * (top < 2500 ? 1.5 : 1);
      if (!best || score > best.score) best = { items, score };
    }
  }
  if (!best) return null;
  const px = (v) => Math.round(parseFloat(v) || 0);
  return best.items.slice(0, 2).map((el, i) => {
    el.setAttribute("data-envola-card", String(i + 1));
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const sizes = new Set();
    for (const n of el.querySelectorAll("*")) {
      if ([...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) sizes.add(px(getComputedStyle(n).fontSize));
    }
    return {
      width: Math.round(r.width),
      height: Math.round(r.height),
      padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(px),
      radius: px(s.borderTopLeftRadius),
      border: s.borderTopWidth !== "0px" ? `${s.borderTopWidth} ${s.borderTopColor}` : null,
      background: s.backgroundColor,
      shadow: s.boxShadow !== "none" ? s.boxShadow.slice(0, 80) : null,
      fontSizes: [...sizes].sort((a, b) => b - a),
      lines: (el.innerText || "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 25),
      images: el.querySelectorAll("img, picture, [style*='background-image']").length,
      buttons: el.querySelectorAll("button, [role=button]").length,
    };
  });
}

async function withCookie(ctx, url) {
  if (args["media-from"]) {
    const base = String(args["media-from"]).replace(/\/$/, "");
    await ctx.route("**/media/**", async (route) => {
      const u = new URL(route.request().url());
      const r = await fetch(base + u.pathname + u.search).catch(() => null);
      if (!r) return route.continue();
      await route.fulfill({ status: r.status, headers: { "content-type": r.headers.get("content-type") || "" }, body: Buffer.from(await r.arrayBuffer()) });
    });
  }
  if (!args.cookie) return;
  const [name, ...v] = String(args.cookie).split("=");
  await ctx.addCookies([{ name, value: v.join("="), url }]);
}

async function shoot(browser, { site, page: p }) {
  const dir = join(CAPTURES_DIR, site, p.key);
  if (!args.force && !args["retry-failed"] && fresh(dir)) return { site, key: p.key, status: "cached" };
  mkdirSync(dir, { recursive: true });
  const meta = { site, key: p.key, url: p.url, capturedAt: new Date().toISOString(), ok: false };
  const ctxOpts = { locale: "ru-RU", timezoneId: "Europe/Moscow", ignoreHTTPSErrors: true };
  const desk = await browser.newContext({ ...ctxOpts, viewport: { width: 1440, height: 900 } });
  await withCookie(desk, p.url);
  try {
    const page = await desk.newPage();
    const resp = await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    meta.httpStatus = resp?.status();
    meta.finalUrl = page.url();
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
    meta.consentDismissed = await dismissConsent(page);
    await settle(page);
    // баннеры согласия часто появляются после гидрации — закрываем ещё раз перед съёмкой
    if (await dismissConsent(page)) meta.consentDismissed = true;
    await page.screenshot({ path: join(dir, "d-first.jpg"), type: "jpeg", quality: 72 });
    meta.metrics = await page.evaluate(metricsInPage);
    if (!args["no-full"]) {
      const h = Math.min(meta.metrics.pageHeight, MAX_FULL);
      await page.screenshot({ path: join(dir, "d-full.jpg"), type: "jpeg", quality: 60, fullPage: true, clip: { x: 0, y: 0, width: 1440, height: h } });
    }
    meta.cards = await page.evaluate(findCards).catch(() => null);
    for (const i of [1, 2]) {
      if (!meta.cards?.[i - 1]) continue;
      await page
        .locator(`[data-envola-card="${i}"]`)
        .screenshot({ path: join(dir, `card-${i}.jpg`), type: "jpeg", quality: 85, timeout: 5000 })
        .catch(() => {});
    }
    const text = (await page.evaluate(() => document.body.innerText)).slice(0, 20000);
    writeFileSync(join(dir, "text.txt"), text);
    // типичные заглушки антибота
    meta.blocked = /verify you are human|checking your browser|captcha|подтвердите, что вы не робот|доступ ограничен|access denied|just a moment|^\s*forbidden|проверки безопасности|security check/im.test(text.slice(0, 1500)) || (meta.httpStatus >= 400);
    meta.ok = !meta.blocked;
  } catch (e) {
    meta.error = String(e.message || e).split("\n")[0];
  } finally {
    await desk.close();
  }
  if (meta.ok && !args["no-mobile"]) {
    const mob = await browser.newContext({
      ...ctxOpts,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    });
    await withCookie(mob, p.url);
    try {
      const page = await mob.newPage();
      await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(1000);
      await dismissConsent(page);
      await page.waitForTimeout(800);
      await dismissConsent(page);
      await page.screenshot({ path: join(dir, "m-first.jpg"), type: "jpeg", quality: 72 });
    } catch (e) {
      meta.mobileError = String(e.message || e).split("\n")[0];
    } finally {
      await mob.close();
    }
  }
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2));
  return { site, key: p.key, status: meta.ok ? "ok" : meta.blocked ? `blocked (${meta.httpStatus})` : `error: ${meta.error}` };
}

const { chromium } = loadPlaywright();
const launch = { headless: !args.headed, args: ["--disable-blink-features=AutomationControlled"] };
const browser = await chromium.launch({ ...launch, channel: args.channel || "chrome" }).catch(() => chromium.launch(launch));
const queue = targets();
const results = [];
if (!queue.length) console.log("Нечего снимать: всё свежее (--force, чтобы переснять).");
const workers = Array.from({ length: Number(args.concurrency || 4) }, async () => {
  while (queue.length) {
    const t = queue.shift();
    const r = await shoot(browser, t);
    results.push(r);
    console.log(`${r.status.padEnd(14)} ${r.site}/${r.key}`);
  }
});
await Promise.all(workers);
await browser.close();
const bad = results.filter((r) => !["ok", "cached"].includes(r.status));
console.log(`\nГотово: ${results.length - bad.length}/${results.length}. Снимки: ${CAPTURES_DIR}`);
