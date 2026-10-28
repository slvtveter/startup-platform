import { expect, test } from "@playwright/test";

// PNG 4×4: сервер сам обрежет и уменьшит до 1024, 512, 256 и 64 пикселей.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAE0lEQVR4nGO0tf3KAANMcBZeDgBH+gF3AbJGaQAAAABJRU5ErkJggg==",
  "base64",
);

/** KAN-34: аватар загружается в редакторе и виден на публичном профиле. */
test("member uploads an avatar and it shows on the public profile", async ({ page }) => {
  await page.request.post("/api/auth/login", { data: { email: "maria@example.com", password: "demo12345" } });
  await page.goto("/me/profile");
  await page.locator("#avatar").setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("button", { name: "Заменить фото" })).toBeVisible();

  await page.goto("/people/mariya-kim");
  const img = page.locator("header img");
  await expect(img).toHaveAttribute("src", /\/media\/avatars\/.+-1024\.webp$/);
  const src = await img.getAttribute("src");
  const res = await page.request.get(src!);
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toBe("image/webp");

  // Возвращаем демо-профиль к исходному виду.
  expect((await page.request.delete("/api/profile/me/avatar")).ok()).toBeTruthy();
});

/** KAN-108: фото основателя видно в составе команды на карточке стартапа. */
test("founder avatar shows in the startup team", async ({ page }) => {
  await page.request.post("/api/auth/login", { data: { email: "alina@example.com", password: "demo12345" } });
  const up = await page.request.post("/api/profile/me/avatar", {
    multipart: { file: { name: "me.png", mimeType: "image/png", buffer: PNG } },
  });
  expect(up.ok()).toBeTruthy();

  await page.goto("/startups/vkusnoryadom");
  const team = page.locator("section", { has: page.getByRole("heading", { name: "Команда" }) });
  await expect(team.locator("img").first()).toHaveAttribute("src", /\/media\/avatars\/.+\.webp$/);

  expect((await page.request.delete("/api/profile/me/avatar")).ok()).toBeTruthy();
});
