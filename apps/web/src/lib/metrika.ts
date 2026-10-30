/**
 * KAN-132: Яндекс Метрика. Загружается только после согласия на аналитические cookie
 * и только на боевом домене: локальные запуски, staging и e2e в статистику не попадают.
 * Номер счётчика не секрет, он виден в коде любой страницы со счётчиком.
 */
export const YM_ID = 113939817;
const PROD_HOST = "envola.ru";

export type Consent = "all" | "necessary";
const KEY = "cookie-consent";

const listeners = new Set<() => void>();
let cached: Consent | null | undefined;

export function subscribeConsent(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** null — посетитель ещё не выбрал. Если localStorage недоступен, спросим снова. */
export function getConsent(): Consent | null {
  if (cached !== undefined) return cached;
  try {
    const v = localStorage.getItem(KEY);
    cached = v === "all" || v === "necessary" ? v : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function setConsent(v: Consent | null) {
  cached = v;
  try {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((cb) => cb());
}

export function metrikaEnabled() {
  return YM_ID > 0 && window.location.hostname === PROD_HOST && getConsent() === "all";
}

type Ym = (id: number, method: string, ...args: unknown[]) => void;

function ym(): Ym | undefined {
  return (window as unknown as { ym?: Ym }).ym;
}

/**
 * Цель Метрики (JavaScript-событие). Названия совпадают с событиями воронки из docs/events.md,
 * чтобы цифры Метрики и /admin можно было сверить. Без согласия ничего не уходит.
 */
export function goal(name: Goal, params?: Record<string, string>) {
  if (!metrikaEnabled()) return;
  ym()?.(YM_ID, "reachGoal", name, params);
}

export type Goal =
  | "landing_path_selected"
  | "signup"
  | "profile_published"
  | "startup_created"
  | "startup_published"
  | "apply_started"
  | "application_sent"
  | "invite_sent"
  | "chat_started";
