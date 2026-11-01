import { expect, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";
const SHOTS = process.env.E2E_SCREENSHOTS;

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.example.com`;
}

/** Код подтверждения из последнего письма в Mailpit. */
export async function codeFromMailpit(email: string) {
  let code = "";
  await expect
    .poll(
      async () => {
        const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
        const { messages = [] } = (await res.json()) as { messages?: { ID: string }[] };
        if (!messages.length) return "";
        const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string };
        code = /^(\d{6})$/m.exec(msg.Text)?.[1] ?? "";
        return code;
      },
      { timeout: 20_000 },
    )
    .not.toBe("");
  return code;
}

/** Регистрация через API: код из письма подтверждает почту и ставит сессию в контекст страницы. */
export async function registerViaApi(page: Page, email: string) {
  expect((await page.request.post("/api/auth/register", { data: { email, password: "e2e-password-1", accept_terms: true, adult: true } })).ok()).toBeTruthy();
  const res = await page.request.post("/api/auth/code", { data: { email, code: await codeFromMailpit(email) } });
  expect(res.ok()).toBeTruthy();
}

/** На открытой форме регистрации: почта, пароль, код из письма. */
export async function fillRegistration(page: Page, email: string) {
  // Ждём гидрацию: иначе React сбросит значения, введённые до неё.
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(email);
  await expect(page.getByLabel("Email")).toHaveValue(email);
  await page.getByLabel("Пароль", { exact: true }).fill("e2e-password-1");
  // Соглашение и 18+ принимаются нажатием кнопки. Публикацию профиля не отмечаем:
  // тесты проверяют и окно согласия при публикации.
  await page.getByRole("button", { name: "Получить код на почту" }).click();
  // Код отправляется сам после шестой цифры.
  await page.getByLabel("Код из письма").fill(await codeFromMailpit(email));
}

export async function register(page: Page, email: string) {
  await page.goto("/register");
  await fillRegistration(page, email);
  // После регистрации — сразу анкета профиля; выбор «Что дальше?» — после неё.
  await page.waitForURL(/\/me\/profile\/edit/);
}

export async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}
