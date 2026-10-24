import { expect, test } from "@playwright/test";

/**
 * KAN-95: prod-сборка под CSP из Caddyfile.prod работает без нарушений.
 * Запускается только в CI-джобе images против поднятого compose.prod.yml (PROD_CHECK=1):
 * в dev-режиме CSP нет, а Next использует eval для HMR.
 */
test.skip(!process.env.PROD_CHECK, "только против prod-стека");
test.use({ ignoreHTTPSErrors: true });

for (const path of ["/", "/startups", "/register"]) {
  test(`no CSP violations on ${path}`, async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /Content Security Policy|Refused to/i.test(msg.text())) violations.push(msg.text());
    });
    const res = await page.goto(path);
    expect(res?.headers()["content-security-policy"]).toContain("default-src 'self'");
    await page.waitForLoadState("networkidle");
    // Гидрация прошла: интерактивный элемент реагирует.
    await expect(page.locator("header a").first()).toBeVisible();
    const fonts = await page.evaluate(() => document.fonts.status);
    expect(fonts).toBe("loaded");
    expect(violations).toEqual([]);
  });
}
