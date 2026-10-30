// Общие помощники скриптов скилла: пути, библиотека сайтов, Playwright из apps/web.
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const REPO_ROOT = resolve(SKILL_DIR, "../../..");
export const CACHE_DIR = join(SKILL_DIR, ".cache");
export const CAPTURES_DIR = join(CACHE_DIR, "captures");
export const PATTERNS_DIR = join(SKILL_DIR, "library", "patterns");

export function loadLibrary() {
  return JSON.parse(readFileSync(join(SKILL_DIR, "library", "sites.json"), "utf8"));
}

// Playwright стоит в apps/web (E2E), отдельно его не ставим.
export function loadPlaywright() {
  const candidates = [join(REPO_ROOT, "apps/web/package.json"), join(process.cwd(), "package.json")];
  for (const pkg of candidates) {
    if (!existsSync(pkg)) continue;
    try {
      return createRequire(pkg)("playwright");
    } catch {}
  }
  console.error("Не нашёл playwright. Выполни `cd apps/web && npm ci` (он уже в devDependencies).");
  process.exit(1);
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      args._.push(a);
      continue;
    }
    const [k, v] = a.slice(2).split("=");
    if (v !== undefined) args[k] = v;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) args[k] = argv[++i];
    else args[k] = true;
  }
  return args;
}

export const list = (v) => (v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : []);
