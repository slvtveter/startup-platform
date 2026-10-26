import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * KAN-86: скриншоты ключевых экранов (артефакт CI `screens`) и проверка доступности axe.
 * Падаем только на нарушениях уровня serious/critical, остальные видны в отчёте.
 */
const AUTH_PAGES = [
  ["my-applications", "/me/applications", "maria@example.com"],
  ["chats", "/chats", "alina@example.com"],
  ["my-profile", "/me/profile", "maria@example.com"],
  ["new-startup", "/startups/new", "alina@example.com"],
  ["dashboard", "/", "alina@example.com"],
  ["admin", "/admin", "admin@example.com"],
] as const;

const PAGES = [
  ["landing", "/"],
  ["startups", "/startups"],
  ["startup", "/startups/vkusnoryadom"],
  ["people", "/people"],
  ["person", "/people/mariya-kim"],
  ["register", "/register"],
] as const;

const VIEWPORTS = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 375, height: 812 }],
] as const;

const DIR = process.env.SCREENS_DIR ?? "test-results/screens";

for (const [vpName, viewport] of VIEWPORTS) {
  test.describe(vpName, () => {
    test.use({ viewport });
    const pages = [...PAGES.map(([n, p]) => [n, p, null] as const), ...AUTH_PAGES];
    for (const [name, path, user] of pages) {
      test(`${name} is accessible and fits the screen`, async ({ page }) => {
        if (user) {
          // Демо-аккаунты из make seed; успешный вход не расходует лимит попыток.
          const res = await page.request.post("/api/auth/login", { data: { email: user, password: "demo12345" } });
          expect(res.ok()).toBeTruthy();
        }
        const res = await page.goto(path);
        // Страница должна существовать: иначе проверка молча проходит на экране 404.
        expect(res?.status(), `${path} отдаёт ошибку`).toBeLessThan(400);
        await page.waitForLoadState("networkidle");
        await page.screenshot({ path: `${DIR}/${vpName}-${name}.png`, fullPage: true });
        // Блоки с появлением при прокрутке (Reveal) открылись во время снимка: ждём конца анимаций,
        // иначе axe замерит контраст полупрозрачного текста посреди перехода. Бесконечные (пульс) не ждём.
        await page.evaluate(() =>
          Promise.all(
            document
              .getAnimations()
              .filter((a) => a.effect?.getTiming().iterations !== Infinity)
              .map((a) => a.finished),
          ),
        );

        const width = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(width, "горизонтальный скролл").toBeLessThanOrEqual(viewport.width);

        const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        const blocking = violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")})`);
        expect(blocking).toEqual([]);
      });
    }
  });
}
