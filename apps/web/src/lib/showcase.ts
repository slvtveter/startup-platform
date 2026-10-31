/**
 * Витрина главной: какие придуманные проекты и людей показываем и куда ведут их карточки.
 * Данные — showcase.data.ts (генерирует apps/api/app/scripts/showcase_export.py), здесь — ручной выбор:
 * портреты отобраны светлые и ровные, тёмные и случайные кадры на главную не попадают.
 */
import type { PersonCard, StartupCard } from "@/lib/api";

import { IDEAS, PEOPLE, STARTUPS } from "./showcase.data";

export { IDEAS, STARTUPS };

function pick(slugs: string[]) {
  return slugs.map((s) => PEOPLE.find((p) => p.slug === s)).filter((p): p is PersonCard => !!p);
}

/** Секция «Кто уже ищет команду». */
export const HOME_PEOPLE = pick(["kirill-morozov-62b4", "alina-tsoy", "ilya-savin", "zhanna-kamara"]);
/** Лица под кнопками первого экрана. */
export const HERO_FACES = pick(["yuna-pak", "kseniya-orlova", "tigran-arutyunyan", "anna-smirnova", "kristina-belaya"]);
/** Карточка «Нужны люди» в «Четырёх дорогах». */
export const PATH_PEOPLE = pick(["kristina-belaya", "polina-mironova", "timur-galiev"]);
/** Карточка «Нет идеи»: те, кто ищет сообщников. */
export const COFOUNDER_FACES = pick(["yuna-pak", "tigran-arutyunyan", "kirill-morozov-62b4", "alina-tsoy", "anna-smirnova"]);
/** Человек в анимации шага «Создай профиль». */
export const STEP_PERSON = pick(["ilya-savin"])[0];

/** Витрина ведёт в каталог по роли: так клик по примеру показывает настоящие проекты и людей. */
export function startupHref(s: StartupCard) {
  const role = s.open_roles[0]?.role.slug;
  return role ? `/startups?role=${role}` : s.stage === "idea" ? "/startups?stage=idea" : "/startups";
}

export function personHref(p: PersonCard) {
  return p.primary_role ? `/people?role=${p.primary_role.slug}` : "/people";
}
