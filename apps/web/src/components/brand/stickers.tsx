import { cn } from "@/lib/utils";

/*
 * Наклейки бренда Envola — графические элементы, которые раскидываем по сайту.
 *
 * Стиль (docs/ux/design-system.md, «Наклейки»):
 * - сетка 64×64, линии 5 (как «e» в логотипе), концы и углы скруглены;
 * - не больше двух цветов бренда плюс белый: василёк #5B8CF0, синий #3B6FE4, второй цвет (--second), мягкий #D6E2FD;
 * - белая обводка по контуру (как у вырезанной наклейки) и мягкая тень — класс .sticker;
 * - без текста и градиентов; лёгкий поворот −12…12° задаётся снаружи (rotate-*);
 * - на экран не больше 2–3 наклеек, только как акцент у заголовка, края фото или карточки.
 * Всё декоративное: aria-hidden.
 */

const C = "#5B8CF0"; // cornflower
const B = "#3B6FE4"; // brand
const I = "var(--second)"; // второй цвет вместо чёрного (globals.css)
const S = "#D6E2FD"; // soft
const W = "#fff";

/** Белая обводка-«вырубка» под заливкой. */
const cut = { stroke: W, strokeWidth: 5, strokeLinejoin: "round" as const, paintOrder: "stroke" as const };
const line = { fill: "none", strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const STICKERS = {
  /** Знак: круг с «e» и отделившейся точкой. */
  mark: (
    <>
      <circle cx="32" cy="32" r="28" fill={C} {...cut} />
      <path d="M18.5 33 H44 A13 13 0 1 0 40 42.4" {...line} stroke={W} strokeWidth={6} />
      <circle cx="45.5" cy="19.5" r="4.2" fill={W} />
    </>
  ),
  /** Разговор: две реплики, синяя впереди. */
  chat: (
    <>
      <path d="M26 10 h22 a10 10 0 0 1 10 10 v8 a10 10 0 0 1 -10 10 h-2 v6 l-7 -6 h-13 a10 10 0 0 1 -10 -10 v-8 a10 10 0 0 1 10 -10 z" fill={I} {...cut} />
      <path d="M14 24 h22 a10 10 0 0 1 10 10 v8 a10 10 0 0 1 -10 10 h-12 l-8 7 v-7 h-2 a10 10 0 0 1 -10 -10 v-8 a10 10 0 0 1 10 -10 z" fill={C} {...cut} />
      <circle cx="17" cy="38" r="3" fill={W} />
      <circle cx="25" cy="38" r="3" fill={W} />
      <circle cx="33" cy="38" r="3" fill={W} />
    </>
  ),

  /** Курсор с щелчком: действие, отклик. */
  cursor: (
    <>
      <path d="M20 16 L48 34 L35 37 L42 51 L35 54 L28 40 L20 48 Z" fill={B} {...cut} />
      <path d="M12 12 l-5 -5 M20 8 v-6 M8 20 h-6" {...line} stroke={I} strokeWidth={4} />
    </>
  ),
  /** Галочка: отклик принят, всё готово. */
  check: (
    <>
      <circle cx="32" cy="32" r="26" fill={B} {...cut} />
      <path d="M20 33 l8 8 l16 -18" {...line} stroke={W} strokeWidth={6} />
    </>
  ),
  /** Код: разработчики. */
  code: (
    <>
      <rect x="6" y="10" width="52" height="44" rx="14" fill={I} {...cut} />
      <path d="M24 24 l-8 8 l8 8 M40 24 l8 8 l-8 8 M35 21 l-6 22" {...line} stroke={B} />
    </>
  ),
  /** Перо векторного редактора: дизайнеры. */
  pen: (
    <>
      <path d="M32 6 L50 30 L42 48 H22 L14 30 Z" fill={C} {...cut} />
      <path d="M32 9 V27" {...line} stroke={W} strokeWidth={3.5} />
      <circle cx="32" cy="31" r="4.5" fill={W} />
      <rect x="20" y="47" width="24" height="11" rx="4" fill={I} {...cut} />
    </>
  ),

  /** Растущие столбики: аналитика и маркетинг. */
  chart: (
    <>
      <rect x="6" y="8" width="52" height="48" rx="14" fill={B} {...cut} />
      <rect x="15" y="34" width="8" height="12" rx="3" fill={S} />
      <rect x="28" y="26" width="8" height="20" rx="3" fill={S} />
      <rect x="41" y="17" width="8" height="29" rx="3" fill={W} />
      <path d="M15 27 L28 20 L41 13" {...line} stroke={I} strokeWidth={3} />
    </>
  ),
  /** Лампочка: идея. */
  bulb: (
    <>
      <path d="M32 6 a18 18 0 0 1 11 32 c-2 2 -3 4 -3 7 h-16 c0 -3 -1 -5 -3 -7 a18 18 0 0 1 11 -32 z" fill={C} {...cut} />
      <rect x="23" y="46" width="18" height="11" rx="5" fill={I} {...cut} />
      <path d="M27 24 a7 7 0 0 1 7 -6" {...line} stroke={W} strokeWidth={4} />
    </>
  ),
  /** Пазл: два человека дополняют друг друга — сообщники, команда. */
  team: (
    <>
      <path d="M8 22 a8 8 0 0 1 8 -8 h14 v9 a6 6 0 1 1 0 12 v15 h-14 a8 8 0 0 1 -8 -8 z" fill={C} {...cut} transform="rotate(-6 20 32)" />
      <path d="M34 14 h14 a8 8 0 0 1 8 8 v20 a8 8 0 0 1 -8 8 h-14 v-15 a6 6 0 1 0 0 -12 z" fill={I} {...cut} transform="translate(2 2) rotate(6 46 32)" />
    </>
  ),

  /** Часы: свободные часы в неделю. */
  clock: (
    <>
      <circle cx="32" cy="32" r="26" fill={S} {...cut} />
      <path d="M32 18 v14 l9 6" {...line} stroke={I} />
      <circle cx="32" cy="32" r="3.5" fill={B} />
    </>
  ),
  /** Вопрос в реплике: частые вопросы, помощь. */
  question: (
    <>
      <path d="M14 8 h36 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-16 l-10 9 v-9 h-10 a10 10 0 0 1 -10 -10 v-20 a10 10 0 0 1 10 -10 z" fill={C} {...cut} />
      <path d="M25 21 a7 7 0 1 1 9.5 6.5 c-1.8 .8 -2.5 2 -2.5 4" {...line} stroke={W} strokeWidth={5} />
      <circle cx="32" cy="40" r="3.2" fill={W} />
    </>
  ),
  /** Шапка выпускника: студенты, без опыта. */
  cap: (
    <>
      <path d="M17 31 V43 Q32 52 47 43 V31 L32 38 Z" fill={I} {...cut} />
      <path d="M5 26 L32 13 L59 26 L32 39 Z" fill={B} {...cut} />
      <path d="M32 26 L50 31 V43" {...line} stroke={C} strokeWidth={3.5} />
      <circle cx="50" cy="46" r="4" fill={C} />
    </>
  ),
  /** Портфель: кейс в портфолио, опыт. */
  case: (
    <>
      <path d="M24 18 v-3 a5 5 0 0 1 5 -5 h6 a5 5 0 0 1 5 5 v3" {...line} stroke={W} strokeWidth={10} />
      <path d="M24 18 v-3 a5 5 0 0 1 5 -5 h6 a5 5 0 0 1 5 5 v3" {...line} stroke={I} />
      <rect x="7" y="18" width="50" height="36" rx="11" fill={B} {...cut} />
      <path d="M7 33 H57" stroke={C} strokeWidth="3" />
      <rect x="27" y="28" width="10" height="10" rx="3" fill={I} />
    </>
  ),
  /** Видеозвонок: созвон с основателем. */
  call: (
    <>
      <rect x="5" y="17" width="38" height="30" rx="10" fill={C} {...cut} />
      <path d="M45 27 L58 19 V45 L45 37 Z" fill={I} {...cut} />
      <circle cx="15" cy="27" r="3.2" fill={W} />
    </>
  ),
  /** Монета с рублём: оплата. */
  coin: (
    <>
      <circle cx="32" cy="32" r="26" fill={I} {...cut} />
      <circle cx="32" cy="32" r="19" fill="none" stroke={W} strokeWidth="2.5" />
      <path d="M28 21 V44 M28 21 h7 a6 6 0 0 1 0 12 h-11 M24 39 h12" {...line} stroke={B} strokeWidth={4.5} />
    </>
  ),
  /** Лупа: найти, кого ищут. */
  search: (
    <>
      <path d="M38 38 L53 53" {...line} stroke={W} strokeWidth={15} />
      <path d="M38 38 L53 53" {...line} stroke={B} strokeWidth={8} />
      <circle cx="27" cy="27" r="17" fill={S} {...cut} />
      <circle cx="27" cy="27" r="14" fill="none" stroke={B} strokeWidth="5" />
      <path d="M20 23 a8 8 0 0 1 7 -5" {...line} stroke={W} strokeWidth={3.5} />
    </>
  ),
  /** Телефон: мобильная разработка, приложение. */
  phone: (
    <>
      <rect x="17" y="5" width="30" height="54" rx="10" fill={B} {...cut} />
      <rect x="21" y="11" width="22" height="38" rx="5" fill={I} />
      <circle cx="32" cy="54" r="2.2" fill={W} />
      <rect x="25" y="16" width="14" height="4" rx="2" fill={W} />
      <rect x="25" y="24" width="9" height="4" rx="2" fill={W} />
    </>
  ),
  /** Мегафон: маркетинг, объявить о проекте. */
  megaphone: (
    <>
      <path d="M12 25 L40 11 V53 L12 39 Z" fill={C} {...cut} />
      <rect x="6" y="24" width="12" height="16" rx="5" fill={B} {...cut} />
      <path d="M17 39 L22 52" {...line} stroke={B} strokeWidth={5} />
      <path d="M47 24 q6 8 0 16 M52 18 q11 14 0 28" {...line} stroke={I} strokeWidth={4} />
    </>
  ),
  /** Флажок: старт, запуск, цель. */
  flag: (
    <>
      <path d="M18 8 V57" {...line} stroke={W} strokeWidth={11} />
      <path d="M18 8 V57" {...line} stroke={B} />
      <path d="M21 10 H52 L44 22 L52 34 H21 Z" fill={C} {...cut} />
      <circle cx="18" cy="8" r="4" fill={I} />
    </>
  ),
  /** Плюс: добавить, опубликовать. */
  plus: (
    <>
      <rect x="8" y="8" width="48" height="48" rx="16" fill={I} {...cut} />
      <path d="M32 21 v22 M21 32 h22" {...line} stroke={B} strokeWidth={6} />
    </>
  ),
  /** Волна: украшение у заголовков. */
  wave: (
    <>
      <path d="M6 36 q6.5 -12 13 0 t13 0 t13 0 t13 0" {...line} stroke={W} strokeWidth={11} />
      <path d="M6 36 q6.5 -12 13 0 t13 0 t13 0 t13 0" {...line} stroke={C} />
    </>
  ),
  /** Закрученная стрелка: «сюда». */
  arrow: (
    <>
      <path d="M10 14 C34 6 52 22 40 34 C32 42 22 34 30 28 C38 22 50 34 48 52" {...line} stroke={W} strokeWidth={11} />
      <path d="M10 14 C34 6 52 22 40 34 C32 42 22 34 30 28 C38 22 50 34 48 52" {...line} stroke={B} />
      <path d="M40 46 l8 7 l6 -9" {...line} stroke={B} />
    </>
  ),
  /** Сердце в реплике: понравился проект, «хочу в команду». */
  like: (
    <>
      <path d="M14 10 h36 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-18 l-10 8 v-8 h-8 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10 z" fill={S} {...cut} />
      <path d="M32 40 c-10 -6 -14 -11 -14 -16 a6.5 6.5 0 0 1 14 -2 a6.5 6.5 0 0 1 14 2 c0 5 -4 10 -14 16 z" fill={B} />
    </>
  ),
  /** Звезда-значок: первый кейс, достижение. */
  star: (
    <>
      <path d="M32 6 l7.6 15.4 l17 2.5 l-12.3 12 l2.9 16.9 l-15.2 -8 l-15.2 8 l2.9 -16.9 l-12.3 -12 l17 -2.5 z" fill={S} {...cut} />
      <path d="M32 18 l3.6 7.3 l8 1.2 l-5.8 5.6 l1.4 8 l-7.2 -3.8 l-7.2 3.8 l1.4 -8 l-5.8 -5.6 l8 -1.2 z" fill={B} />
    </>
  ),
};

export type StickerName = keyof typeof STICKERS;
export const STICKER_NAMES = Object.keys(STICKERS) as StickerName[];

export function Sticker({ name, className, style }: { name: StickerName; className?: string; style?: React.CSSProperties }) {
  return (
    <svg aria-hidden viewBox="-4 -4 72 72" className={cn("sticker pointer-events-none select-none", className)} style={style}>
      {STICKERS[name]}
    </svg>
  );
}
