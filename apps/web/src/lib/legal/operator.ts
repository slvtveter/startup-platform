/**
 * Оператор персональных данных и администратор платформы. Подставляется в /terms и /privacy.
 * Появится ООО — замени имя на наименование с ОГРН, ИНН и адресом и подними редакцию.
 */
export const OPERATOR = {
  name: "Сергеев Илья Андреевич",
  email: "slvtveter@gmail.com",
};

export const EDITION = "31 октября 2026 года";

export function fill(html: string) {
  if (!OPERATOR.name || !OPERATOR.email) throw new Error("lib/legal/operator.ts: не заполнены реквизиты оператора");
  return html.replaceAll("{{OPERATOR}}", OPERATOR.name).replaceAll("{{EMAIL}}", OPERATOR.email);
}
