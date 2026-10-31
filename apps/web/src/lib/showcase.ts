/**
 * Витрина главной: какие придуманные проекты и людей показываем и куда ведут их карточки.
 * Данные — showcase.data.ts (генерирует apps/api/app/scripts/showcase_export.py), здесь — ручной выбор:
 * портреты отобраны светлые и ровные, тёмные и случайные кадры на главную не попадают.
 */
import type { PersonCard, StartupCard } from "@/lib/api";

import { IDEAS, PEOPLE, STARTUPS } from "./showcase.data";

export { IDEAS, STARTUPS };

/** По началу слага: генератор может добавить к нему хвост вроде «-80b9». */
function pick(slugs: string[]) {
  return slugs.map((s) => PEOPLE.find((p) => p.slug === s || p.slug.startsWith(`${s}-`))).filter((p): p is PersonCard => !!p);
}

/** Секция «Кто уже ищет команду». */
export const HOME_PEOPLE = pick(["kirill-morozov", "vera-sokolova", "ilya-savin", "liza-gromova"]);
/** Лица под кнопками первого экрана. */
export const HERO_FACES = pick(["kristina-belaya", "daniil-andreev", "svetlana-yudina", "arseniy-belov", "eva-lunina"]);
/** Карточка «Нужны люди» в «Четырёх дорогах». */
export const PATH_PEOPLE = pick(["denis-galkin", "maksim-lisitsyn", "polina-mironova"]);
/** Карточка «Нет идеи»: те, кто ищет сообщников. */
export const COFOUNDER_FACES = pick(["irina-guseva", "yulya-panova", "kirill-morozov", "alena-kuznetsova", "eva-lunina"]);
/** Человек в анимации шага «Создай профиль». */
export const STEP_PERSON = pick(["daniil-andreev"])[0];

/** Витрина ведёт в каталог по роли: так клик по примеру показывает настоящие проекты и людей. */
export function startupHref(s: StartupCard) {
  const role = s.open_roles[0]?.role.slug;
  return role ? `/startups?role=${role}` : s.stage === "idea" ? "/startups?stage=idea" : "/startups";
}

export function personHref(p: PersonCard) {
  return p.primary_role ? `/people?role=${p.primary_role.slug}` : "/people";
}
