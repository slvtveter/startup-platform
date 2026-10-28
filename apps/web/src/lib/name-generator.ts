/**
 * Подсказки названий для стартапа (KAN-138 п.4): чтобы не залипать на шаге «название».
 * Звучат как настоящие продукты: короткое слово-образ, иногда с приставкой вроде Lab или AI.
 * Всё на фронте, без внешних сервисов.
 */

// Латиница: так называют большинство продуктов, и имя не привязано к одному рынку.
const ROOTS = [
  "Nova", "Orbit", "Pulse", "Vector", "Atlas", "Tandem", "Relay", "Signal", "Forma", "Spark",
  "Lumen", "Prism", "Mosaic", "Beacon", "Loop", "Shift", "Scope", "Ember", "Harbor", "Summit",
  "Pilot", "Quill", "Nimbus", "Kinetic", "Meridian", "Cobalt", "Fathom", "Verso", "Sola", "Arc",
];
// Окончания, которые не ломают слово: для корней на согласную.
const TAILS = ["ly", "io"];
const LABELS = ["Lab", "AI", "Hub", "Works", "Studio", "Labs"];

// Кириллица: короткие слова-образы, понятные без перевода.
const RU = [
  "Маяк", "Вектор", "Тандем", "Импульс", "Опора", "Формула", "Орбита", "Сигнал", "Компас", "Ракурс",
  "Пульс", "Мост", "Сфера", "Зенит", "Причал", "Основа", "Контур", "Азимут", "Парус", "Эхо",
];
const RU_LABELS = ["Лаб", "Клуб"];

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

export function generateName(): string {
  const roll = Math.random();
  if (roll < 0.25) return pick(RU);
  if (roll < 0.35) return `${pick(RU)} ${pick(RU_LABELS)}`;
  const root = pick(ROOTS);
  if (roll < 0.6) return root;
  if (roll < 0.8 && !/[aeiouy]$/i.test(root)) return root + pick(TAILS);
  return `${root} ${pick(LABELS)}`;
}

/** Несколько разных вариантов сразу — из них удобнее выбирать. */
export function generateNames(count = 3): string[] {
  const out = new Set<string>();
  while (out.size < count) out.add(generateName());
  return [...out];
}
