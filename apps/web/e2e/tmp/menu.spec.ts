import { test } from "@playwright/test";
test("menu", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.request.post("/api/auth/login", { data: { email: "alina@example.com", password: "demo12345" } });
  await page.goto("/");
  await page.getByRole("button", { name: "Меню аккаунта" }).click();
  await page.waitForTimeout(500);
  console.log("errs:", errors.slice(0,3).map(e=>e.slice(0,300)), "expanded:", await page.getByRole("button", { name: "Меню аккаунта" }).getAttribute("aria-expanded"));
  console.log("menuitems:", await page.getByRole("menuitem").allTextContents());
  await page.getByRole("menuitem", { name: "Мой профиль" }).click().catch((e) => console.log("click err", e.message.slice(0, 200)));
  await page.waitForTimeout(1500);
  console.log("url:", page.url(), "errors:", errors.slice(0, 3));
});
