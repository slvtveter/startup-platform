#!/usr/bin/env node
// Поиск по библиотеке: какой паттерн нужен под задачу и у кого его смотреть.
//
//   node refs.mjs "карточка лида"     паттерны по словам задачи + сайты + файл разбора + статус снимков
//   node refs.mjs person-card          сразу по тегу
//   node refs.mjs --tags               все теги
//   node refs.mjs --status             покрытие снимками по тегам
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { CAPTURES_DIR, PATTERNS_DIR, REPO_ROOT, loadLibrary, parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const lib = loadLibrary();
const rel = (p) => relative(REPO_ROOT, p);

// Разбор паттерна: файл <тег>.md или файл, в заголовке которого перечислен тег: «(теги catalog, filters, search)».
function patternFile(tag) {
  const direct = join(PATTERNS_DIR, `${tag}.md`);
  if (existsSync(direct)) return direct;
  for (const f of existsSync(PATTERNS_DIR) ? readdirSync(PATTERNS_DIR) : []) {
    const head = readFileSync(join(PATTERNS_DIR, f), "utf8").split("\n")[0];
    const m = head.match(/\(теги ([^)]+)\)/);
    if (m && m[1].split(/[,\s]+/).includes(tag)) return join(PATTERNS_DIR, f);
  }
  return null;
}

function shot(siteId, key) {
  const f = join(CAPTURES_DIR, siteId, key, "meta.json");
  if (!existsSync(f)) return "не снят";
  const m = JSON.parse(readFileSync(f, "utf8"));
  return m.ok ? `ок ${m.capturedAt.slice(0, 10)}` : m.blocked ? "блок" : "ошибка";
}

if (args.tags) {
  for (const [k, t] of Object.entries(lib.tags)) {
    const n = lib.sites.filter((s) => s.tags.includes(k)).length;
    const pat = patternFile(k) ? "разбор есть" : "без разбора";
    console.log(`${k.padEnd(20)} ${String(n).padStart(2)} сайтов, ${pat.padEnd(11)} ${t.desc}`);
  }
  process.exit(0);
}

if (args.status) {
  for (const k of Object.keys(lib.tags)) {
    const sites = lib.sites.filter((s) => s.tags.includes(k));
    const ok = sites.filter((s) => s.pages.some((p) => shot(s.id, p.key).startsWith("ок"))).length;
    console.log(`${k.padEnd(20)} снято ${ok}/${sites.length}`);
  }
  process.exit(0);
}

const q = args._.join(" ").toLowerCase().trim();
if (!q) {
  console.error('Пример: node refs.mjs "карточка лида"   или   node refs.mjs --tags');
  process.exit(1);
}

// Оценка тега: точное имя > алиас целиком в запросе > пересечение слов с описанием.
const words = q.split(/[\s,.;:/]+/).filter((w) => w.length > 2);
const scored = Object.entries(lib.tags)
  .map(([k, t]) => {
    let s = 0;
    if (q === k || q.includes(k)) s += 100;
    for (const a of t.aliases) if (q.includes(a)) s += 10 + a.length;
    for (const w of words) {
      const stem = w.slice(0, Math.max(4, w.length - 2));
      if (t.desc.toLowerCase().includes(stem)) s += 3;
      if (t.aliases.some((a) => a.includes(stem))) s += 4;
    }
    return { k, s };
  })
  .filter((x) => x.s > 0)
  .sort((a, b) => b.s - a.s)
  .slice(0, 3);

if (!scored.length) {
  console.log("Тег не угадан. Посмотри `node refs.mjs --tags` и выбери вручную.");
  process.exit(0);
}

for (const { k } of scored) {
  const pat = patternFile(k);
  console.log(`\n## ${k} — ${lib.tags[k].desc}`);
  console.log(`Разбор: ${pat ? rel(pat) : "нет (собери по workflow «новый паттерн»)"}`);
  const sites = lib.sites
    .filter((s) => s.tags.includes(k))
    .sort((a, b) => Number(!!a.antipattern) - Number(!!b.antipattern) || (a.kind === "niche" ? -1 : 1) - (b.kind === "niche" ? -1 : 1));
  for (const s of sites) {
    const pages = s.pages.map((p) => `${p.key} [${shot(s.id, p.key)}]`).join(", ");
    console.log(`- ${s.id.padEnd(16)} ${s.region} ${s.antipattern ? "АНТИПРИМЕР " : ""}${s.why}\n  ${pages}`);
  }
}
console.log(`\nСнять/обновить: node ${rel(join(REPO_ROOT, ".claude/skills/envola-design/scripts/capture.mjs"))} --tag ${scored[0].k}`);
