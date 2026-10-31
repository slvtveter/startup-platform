import { cn } from "@/lib/utils";

/*
 * Наклейки бренда Envola — графические элементы, которые раскидываем по сайту.
 *
 * Стиль (docs/ux/design-system.md, «Наклейки»):
 * - сетка 64×64, линии 5 (как «e» в логотипе), концы и углы скруглены;
 * - не больше двух цветов бренда плюс белый: василёк #5B8CF0, синий #3B6FE4, чернила #0F1B2D, мягкий #D6E2FD;
 * - белая обводка по контуру (как у вырезанной наклейки) и мягкая тень — класс .sticker;
 * - без текста и градиентов; лёгкий поворот −12…12° задаётся снаружи (rotate-*);
 * - на экран не больше 2–3 наклеек, только как акцент у заголовка, края фото или карточки.
 * Всё декоративное: aria-hidden.
 */

const C = "#5B8CF0"; // cornflower
const B = "#3B6FE4"; // brand
const I = "#0F1B2D"; // ink
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
  /** Искра: первый опыт, «получилось». */
  spark: (
    <>
      <path d="M30 6 C32 22 38 28 54 30 C38 32 32 38 30 56 C28 38 22 32 6 30 C22 28 28 22 30 6 Z" fill={C} {...cut} />
      <circle cx="52" cy="12" r="5" fill={I} {...cut} />
    </>
  ),
  /** Курсор с щелчком: действие, отклик. */
  cursor: (
    <>
      <path d="M20 16 L48 34 L35 37 L42 51 L35 54 L28 40 L20 48 Z" fill={I} {...cut} />
      <path d="M12 12 l-5 -5 M20 8 v-6 M8 20 h-6" {...line} stroke={C} strokeWidth={4} />
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
      <path d="M24 24 l-8 8 l8 8 M40 24 l8 8 l-8 8 M35 21 l-6 22" {...line} stroke={C} />
    </>
  ),
  /** Кривая Безье с узлами: дизайнеры. */
  pen: (
    <>
      <rect x="6" y="10" width="52" height="44" rx="14" fill={S} {...cut} />
      <path d="M14 44 C20 18 44 46 50 20" {...line} stroke={B} />
      <path d="M14 44 L26 20 M50 20 L38 44" fill="none" stroke={I} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="10" y="40" width="8" height="8" rx="2" fill={W} stroke={I} strokeWidth="2.5" />
      <rect x="46" y="16" width="8" height="8" rx="2" fill={W} stroke={I} strokeWidth="2.5" />
      <circle cx="26" cy="20" r="3" fill={I} />
      <circle cx="38" cy="44" r="3" fill={I} />
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
  /** Две точки, связанные дугой: сообщники, команда. */
  link: (
    <>
      <path d="M16 42 C16 18 48 18 48 42" {...line} stroke={W} strokeWidth={13} />
      <path d="M16 42 C16 18 48 18 48 42" {...line} stroke={I} />
      <circle cx="16" cy="44" r="10" fill={C} {...cut} />
      <circle cx="48" cy="44" r="10" fill={B} {...cut} />
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
  /** Плюс: добавить, опубликовать. */
  plus: (
    <>
      <rect x="8" y="8" width="48" height="48" rx="16" fill={I} {...cut} />
      <path d="M32 21 v22 M21 32 h22" {...line} stroke={W} strokeWidth={6} />
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
      <path d="M10 14 C34 6 52 22 40 34 C32 42 22 34 30 28 C38 22 50 34 48 52" {...line} stroke={I} />
      <path d="M40 46 l8 7 l6 -9" {...line} stroke={I} />
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
