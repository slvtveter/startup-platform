import { expect, test } from "@playwright/test";

import { register, shot, uniqueEmail, verifyEmailViaMailpit } from "./helpers";

/**
 * Definition of done фазы 1 (KAN-68): основатель публикует стартап, новичок регистрируется,
 * заполняет профиль, откликается, основатель принимает, и оба видят контакты друг друга.
 */
test("full phase 1 flow: register → profile → startup → apply → accept → contacts", async ({ browser }) => {
  const stamp = Date.now();
  const startupTitle = `E2E Стартап ${stamp}`;

  // --- Основатель: регистрация, подтверждение почты, стартап с ролью ---
  const founderCtx = await browser.newContext();
  const founder = await founderCtx.newPage();
  const founderEmail = uniqueEmail("founder");
  await register(founder, founderEmail);
  await verifyEmailViaMailpit(founder, founderEmail);

  // Мастер создания (KAN-138 п.4): по одному вопросу на экран.
  await founder.goto("/startups/new");
  const next = founder.getByRole("button", { name: "Дальше" });
  await founder.getByLabel("Название", { exact: true }).fill(startupTitle);
  await next.click();
  await founder.getByLabel("Идея одной фразой").fill("Сервис, который проверяет весь путь фазы 1");
  await next.click();
  await founder
    .getByLabel("Подробнее о проекте")
    .fill("Мы автоматически проверяем, что новичок может найти стартап, откликнуться и познакомиться с основателем.");
  await next.click();
  await next.click(); // стадия по умолчанию
  await founder.getByRole("button", { name: /^Обсуждается/ }).click();
  await next.click();
  await founder.getByRole("button", { name: "Маркетолог", exact: true }).click();
  await next.click();
  await founder.getByRole("button", { name: "В черновик" }).click();
  await founder.waitForURL(/\/edit$/);

  // Роль с навыком — через редактор: в мастере роли создаются по шаблону без навыков.
  await founder.getByRole("button", { name: "Добавить место" }).click();
  await founder.getByPlaceholder("Название роли").fill("UI/UX дизайнер");
  await founder.getByPlaceholder("Начни вводить").fill("Figma");
  await founder.getByRole("button", { name: "+ Figma" }).click();
  await founder.getByRole("button", { name: "Добавить роль" }).click();
  await expect(founder.getByText("UI/UX дизайнер").first()).toBeVisible();
  await founder.getByRole("button", { name: "Опубликовать" }).click();
  await founder.waitForURL(/\/startups\/[^/]+$/);
  const startupUrl = new URL(founder.url()).pathname;
  await expect(founder.getByRole("heading", { name: startupTitle })).toBeVisible();
  await shot(founder, "startup-page-owner");

  // --- Новичок: регистрация, профиль в 3 шага, публикация ---
  const candidateCtx = await browser.newContext();
  const candidate = await candidateCtx.newPage();
  const candidateEmail = uniqueEmail("candidate");
  const tg = `e2e_${stamp}`;
  await register(candidate, candidateEmail);
  await shot(candidate, "onboarding-step1");
  await verifyEmailViaMailpit(candidate, candidateEmail);

  await candidate.goto("/me/profile?welcome=1");
  await candidate.getByLabel("Имя или псевдоним").fill("Мария Тестова");
  await candidate.getByRole("button", { name: "Дизайнер", exact: true }).click();
  await candidate.getByRole("button", { name: "После курсов" }).click();
  await candidate.getByLabel("Коротко о себе").fill("Дизайнер после курсов, ищу первый проект");
  await candidate.getByRole("button", { name: "Дальше" }).click();

  await candidate.getByPlaceholder("Начни вводить").fill("Figma");
  await candidate.getByRole("button", { name: "+ Figma" }).click();
  await candidate.getByPlaceholder("behance.net/your-name").fill("behance.net/maria-test");
  await shot(candidate, "onboarding-step2");
  await candidate.getByRole("button", { name: "Дальше" }).click();

  await candidate.getByRole("button", { name: /^Бесплатно/ }).click();
  await candidate.getByRole("button", { name: /^За долю/ }).click();
  await candidate.getByLabel("Telegram").fill(`@${tg}`);
  await candidate.getByRole("button", { name: "Сохранить и опубликовать" }).click();
  await candidate.waitForURL(/\/startups$/);

  // --- Отклик ---
  await candidate.goto(startupUrl);
  await expect(candidate.getByText("1 из 1 совпадают с твоими навыками")).toBeVisible();
  await candidate.getByRole("button", { name: "Откликнуться" }).click();
  await candidate
    .getByLabel("Сообщение основателю")
    .fill("Здравствуйте! Делала учебный проект с похожими экранами, готова начать на этой неделе.");
  await shot(candidate, "apply-dialog");
  await candidate.getByRole("button", { name: "Отправить отклик" }).click();
  await candidate.waitForURL(/\/me\/applications/);
  await expect(candidate.getByText("На рассмотрении")).toBeVisible();

  // --- Основатель принимает: контакты кандидата открываются ---
  await founder.goto("/me/startups");
  await shot(founder, "my-startups");
  // Счётчик на кнопке аккаунта (KAN-101): новый отклик виден, после просмотра пропадает.
  await expect(founder.getByRole("button", { name: "Меню аккаунта, новых событий: 1" })).toBeVisible();
  await founder.getByRole("link", { name: "Отклики" }).first().click();
  await expect(founder.getByText("Мария Тестова")).toBeVisible();
  await expect(founder.getByRole("button", { name: /новых событий/ })).toHaveCount(0);
  await shot(founder, "incoming");
  await founder.getByRole("button", { name: "Принять" }).click();
  await expect(founder.getByText(`@${tg}`)).toBeVisible();

  // --- Кандидат видит контакты основателя ---
  await candidate.goto("/");
  await expect(candidate.getByRole("button", { name: "Меню аккаунта, новых событий: 1" })).toBeVisible();
  await candidate.goto("/me/applications");
  await expect(candidate.getByRole("heading", { name: "Тебя приняли" })).toBeVisible();
  await expect(candidate.getByText("Принят", { exact: true })).toBeVisible();
  await expect(candidate.getByText(founderEmail)).toBeVisible();
  await expect(candidate.getByText("Что дальше")).toBeVisible();
  await expect(candidate.getByText(/Напиши основателю в чат первым/)).toBeVisible();
  await shot(candidate, "my-applications");

  // Роль с одним местом закрылась автоматически.
  await candidate.goto(startupUrl);
  await expect(candidate.getByText("Место занято")).toBeVisible();

  await founderCtx.close();
  await candidateCtx.close();
});

/** Меню аккаунта открывается и ведёт в профиль (раньше падало при открытии). */
test("account menu opens and leads to the profile", async ({ page }) => {
  await page.request.post("/api/auth/login", { data: { email: "alina@example.com", password: "demo12345" } });
  await page.goto("/");
  await page.getByRole("button", { name: /Меню аккаунта/ }).click();
  await page.getByRole("menuitem", { name: /Мой профиль/ }).click();
  await expect(page).toHaveURL(/\/me\/profile$/);
});
