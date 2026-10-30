import { asList, type SearchParams } from "@/components/domain/filters";

/**
 * Посадочные страницы каталогов для поиска, как «Работа дизайнером» на hh или /vacancies/analitik на Хабр Карьере.
 * Индексируем только чистые адреса: каталог целиком, одна роль (?role=designer) и идеи (?stage=idea).
 * Любая другая комбинация фильтров, поиск и страницы ссылаются canonical на ближайшую посадочную,
 * чтобы поисковик не считал сотни сочетаний фильтров дублями.
 */

const HISSING = /[кгхжшщч]$/;

// Склоняем первое слово названия роли: «Аналитик данных» → «аналитика данных». Каталог ролей —
// существительные мужского рода, правила хватает; новое название без согласной на конце остаётся как есть.
function inflect(name: string, form: "acc" | "plural") {
  const [head, ...rest] = name.split(" ");
  let w = head;
  if (form === "acc") {
    if (/[ьй]$/.test(w)) w = w.slice(0, -1) + "я";
    else if (/[бвгджзклмнпрстфхцчшщ]$/.test(w)) w += "а";
  } else {
    if (/[ьй]$/.test(w)) w = w.slice(0, -1) + "и";
    else if (HISSING.test(w)) w += "и";
    else if (/[бвдзлмнпрстфц]$/.test(w)) w += "ы";
  }
  return [w, ...rest].join(" ");
}

/** Строчная первая буква только у кириллических названий: «дизайнера», но «ML-инженера», «DevOps-инженера». */
function lower(s: string) {
  return /^[А-ЯЁ][а-яё]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

export const roleAcc = (name: string) => lower(inflect(name, "acc"));
export const rolePlural = (name: string) => inflect(name, "plural");

type Role = { slug: string; name: string };
export type CatalogSeo = { title: string; description: string; h1: string; canonical: string };

/** Единственная выбранная роль, если кроме неё ничего не задано (поиск, сортировка, страница не в счёт). */
function soleRole(params: SearchParams, roles: Role[], extra: string[]) {
  const role = asList(params.role);
  if (role.length !== 1 || extra.some((k) => asList(params[k]).length)) return null;
  return roles.find((r) => r.slug === role[0]) ?? null;
}

export function startupsSeo(params: SearchParams, roles: Role[]): CatalogSeo {
  const role = soleRole(params, roles, ["stage", "terms", "skill"]);
  if (role)
    return {
      title: `Стартапы ищут ${roleAcc(role.name)}`,
      description: `Идеи и стартапы, которым нужен ${lower(role.name)}: стадия, оплата и команда. Для студентов и начинающих в IT, можно без опыта.`,
      h1: `Стартапы ищут ${roleAcc(role.name)}`,
      canonical: `/startups?role=${role.slug}`,
    };
  const stage = asList(params.stage);
  if (stage.length === 1 && stage[0] === "idea" && !["role", "terms", "skill"].some((k) => asList(params[k]).length))
    return {
      title: "Идеи стартапов, к которым можно подключиться",
      description: "Идеи студентов и начинающих основателей, которым нужны разработчики, дизайнеры и маркетологи. Подключайся с самого начала.",
      h1: "Идеи",
      canonical: "/startups?stage=idea",
    };
  const one = asList(params.role).length === 1 ? roles.find((r) => r.slug === asList(params.role)[0]) : null;
  return {
    title: "Стартапы и идеи ищут людей в команду",
    description: "Идеи и стартапы от прототипа до запущенного продукта, которые ищут дизайнеров, разработчиков, маркетологов и аналитиков.",
    h1: "Стартапы",
    canonical: one ? `/startups?role=${one.slug}` : "/startups",
  };
}

export function peopleSeo(params: SearchParams, roles: Role[]): CatalogSeo {
  const role = soleRole(params, roles, ["level", "looking_for", "cofound", "skill"]);
  if (role)
    return {
      title: `${rolePlural(role.name)} для стартапа`,
      description: `${rolePlural(role.name)}, которые хотят в стартап: студенты, выпускники курсов и джуны. Навыки, опыт и условия в каждом профиле.`,
      h1: rolePlural(role.name),
      canonical: `/people?role=${role.slug}`,
    };
  const one = asList(params.role).length === 1 ? roles.find((r) => r.slug === asList(params.role)[0]) : null;
  return {
    title: "Люди: дизайнеры, разработчики, маркетологи",
    description: "Студенты и начинающие в IT: кто ищет команду, кто хочет придумать стартап с нуля. Фильтр по роли, опыту и условиям.",
    h1: "Люди",
    canonical: one ? `/people?role=${one.slug}` : "/people",
  };
}
