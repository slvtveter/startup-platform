import { expect, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";
const SHOTS = process.env.E2E_SCREENSHOTS;

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.example.com`;
}

/** Достаём токен подтверждения из последнего письма в Mailpit. */
export async function verifyEmailViaMailpit(page: Page, email: string) {
  let token = "";
  await expect
    .poll(
      async () => {
        const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
        const { messages = [] } = (await res.json()) as { messages?: { ID: string }[] };
        if (!messages.length) return "";
        const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string };
        token = /token=([\w-]+)/.exec(msg.Text)?.[1] ?? "";
        return token;
      },
      { timeout: 20_000 },
    )
    .not.toBe("");
  await page.goto(`/verify-email?token=${token}`);
  await expect(page.getByRole("heading", { name: "Email подтверждён" })).toBeVisible();
}

export async function register(page: Page, email: string) {
  await page.goto("/register");
  // Ждём гидрацию: иначе React сбросит значения, введённые до неё.
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(email);
  await expect(page.getByLabel("Email")).toHaveValue(email);
  await page.getByLabel("Пароль").fill("e2e-password-1");
  await page.getByText("Мне есть 18 лет").click();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  // После регистрации — развилка «С чего начнёшь?», дальше профиль.
  await page.waitForURL(/\/welcome/);
  await page.getByRole("button", { name: /Хочу в команду/ }).click();
  await page.waitForURL(/\/me\/profile/);
}

export async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}
