import { expect, test } from "@playwright/test";

import { register, uniqueEmail, verifyEmailViaMailpit } from "./helpers";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

/** KAN-72: смена почты вступает в силу только после перехода по ссылке с нового адреса. */
test("user changes email after confirming the new address", async ({ page }) => {
  const oldEmail = uniqueEmail("old");
  const newEmail = uniqueEmail("new");
  await register(page, oldEmail);
  await verifyEmailViaMailpit(page, oldEmail);

  await page.goto("/me/settings");
  // Форма раскрывается по кнопке: смена почты нужна редко.
  await page.getByRole("button", { name: "Изменить" }).first().click();
  await page.getByLabel("Новый адрес").fill(newEmail);
  await page.getByLabel("Текущий пароль").fill("e2e-password-1");
  await page.getByRole("button", { name: "Сменить почту" }).click();
  await expect(page.getByText(`Мы отправили ссылку на ${newEmail}`)).toBeVisible();
  await expect(page.getByText(oldEmail)).toBeVisible();

  let token = "";
  await expect
    .poll(async () => {
      const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${newEmail}"`)}`);
      const { messages = [] } = (await res.json()) as { messages?: { ID: string }[] };
      if (!messages.length) return "";
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string };
      token = /confirm-email\?token=([\w-]+)/.exec(msg.Text)?.[1] ?? "";
      return token;
    }, { timeout: 30_000 })
    .not.toBe("");

  await page.goto(`/confirm-email?token=${token}`);
  await expect(page.getByRole("heading", { name: "Почта изменена" })).toBeVisible();
  await page.goto("/me/settings");
  await expect(page.getByText(newEmail)).toBeVisible();
});
