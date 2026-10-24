import { defineConfig } from "@playwright/test";

// E2E идут против поднятого docker compose (Caddy на :8080, Mailpit на :8025) с seed-данными.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    // Плашка о cookie (KAN-130) уже закрыта, чтобы не перекрывать кнопки и снапшоты. Её проверяет cookie-notice.spec.
    storageState: { cookies: [], origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: "cookie-notice", value: "1" }] }] },
    // Системный Chrome: не нужно скачивать браузеры Playwright.
    channel: "chrome",
    locale: "ru-RU",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
});
