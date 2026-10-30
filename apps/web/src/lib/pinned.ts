/**
 * Витрина без случайностей: только примеры (is_demo), если они есть; иначе (локально без сида) — всё как есть.
 * Новые реальные профили и проекты не сдвигают карточки на главной и на «Сообщниках».
 */
export function pinned<T extends { is_demo?: boolean }>(items: T[]) {
  return items.some((x) => x.is_demo) ? items.filter((x) => x.is_demo) : items;
}
