import { expect, test } from "@playwright/test";

import { nextStep, type NextStepInput } from "../src/lib/next-step";

// Юнит-тест без браузера: выбор «следующего шага» на главной (KAN-84).
const base: NextStepInput = {
  emailVerified: true,
  applyBlockers: [],
  pendingIncoming: [],
  applications: [],
  hasStartups: false,
  now: new Date("2026-10-24T12:00:00Z"),
};

test("next step for every user state", () => {
  expect(nextStep({ ...base, pendingIncoming: [{ slug: "a", title: "A", count: 3 }] })).toMatchObject({
    kind: "answer",
    title: "Ответь на 3 отклика",
    href: "/me/startups/a",
  });
  expect(
    nextStep({ ...base, applications: [{ status: "accepted", startupTitle: "EcoCup", decidedAt: "2026-10-23T12:00:00Z" }] }),
  ).toMatchObject({ kind: "accepted", title: "Тебя приняли в EcoCup" });
  expect(nextStep({ ...base, emailVerified: false }).kind).toBe("verify");
  expect(nextStep({ ...base, applyBlockers: ["Укажите имя"] }).kind).toBe("profile");
  expect(nextStep(base).kind).toBe("apply");
  expect(nextStep({ ...base, applications: [{ status: "pending", startupTitle: "A", decidedAt: null }] })).toMatchObject({
    kind: "wait",
    title: "1 отклик ждёт ответа",
  });
  // Старое «принято» больше не главное действие.
  expect(
    nextStep({ ...base, applications: [{ status: "accepted", startupTitle: "A", decidedAt: "2026-09-01T00:00:00Z" }] }).kind,
  ).toBe("wait");
});
