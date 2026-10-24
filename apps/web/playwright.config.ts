import { defineConfig } from "@playwright/test";

// E2E идут против поднятого docker compose (Caddy на :8080, Mailpit на :8025) с seed-данными.
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    // Системный Chrome: не нужно скачивать браузеры Playwright.
    channel: "chrome",
    locale: "ru-RU",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
});
