import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * KAN-86: скриншоты ключевых экранов (артефакт CI `screens`) и проверка доступности axe.
 * Падаем только на нарушениях уровня serious/critical, остальные видны в отчёте.
 */
const PAGES = [
  ["landing", "/"],
  ["startups", "/startups"],
  ["startup", "/startups/vkusnoryadom"],
  ["people", "/people"],
  ["person", "/people/maria"],
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
    for (const [name, path] of PAGES) {
      test(`${name} is accessible and fits the screen`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await page.screenshot({ path: `${DIR}/${vpName}-${name}.png`, fullPage: true });

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
