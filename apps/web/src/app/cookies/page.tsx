import Link from "next/link";

import { Container } from "@/components/domain/page-header";
import { ConsentSwitch } from "@/components/site/consent-switch";

export const metadata = { title: "Cookie и данные" };

const COOKIES = [
  { name: "session", why: "Вход в аккаунт. Без неё сайт не узнает вас после входа", ttl: "30 дней или до выхода" },
];

// Список Яндекса: https://yandex.ru/support/metrica/general/cookie-usage.html
const ANALYTICS = [
  { name: "_ym_uid, _ym_d", why: "Отличают одного посетителя от другого, без имени и контактов", ttl: "1 год" },
  { name: "_ym_isad, _ym_visorc", why: "Служебные: блокировщик рекламы, запись Вебвизора", ttl: "до 2 дней" },
  { name: "_ym_*, yandexuid, ymex", why: "Прочие служебные cookie Метрики на mc.yandex.ru", ttl: "до 1 года" },
];

function CookieTable({ rows }: { rows: { name: string; why: string; ttl: string }[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="p-3 font-semibold">Имя</th>
            <th className="p-3 font-semibold">Зачем</th>
            <th className="p-3 font-semibold">Срок</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.name} className="border-t">
              <td className="p-3 font-mono">{c.name}</td>
              <td className="p-3">{c.why}</td>
              <td className="p-3 whitespace-nowrap">{c.ttl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** KAN-130, KAN-132: какие cookie ставит сайт и как отказаться от аналитики. */
export default function CookiesPage() {
  return (
    <Container className="max-w-2xl py-16">
      <h1 className="text-[32px] font-bold">Cookie и данные</h1>
      <p className="mt-4 text-muted-foreground">
        Cookie — небольшая запись, которую сайт сохраняет в браузере. Рекламы на сайте нет.
      </p>

      <h2 className="mt-10 text-xl font-bold">Необходимые</h2>
      <CookieTable rows={COOKIES} />
      <p className="mt-4 text-sm text-muted-foreground">
        Cookie сессии недоступна скриптам на странице и передаётся только по HTTPS. Удалить её можно, выйдя из аккаунта или
        очистив данные сайта в настройках браузера.
      </p>

      <h2 className="mt-10 text-xl font-bold">Аналитика: Яндекс Метрика</h2>
      <p className="mt-4 text-muted-foreground">
        Только если вы согласились. Метрика считает посещения, показывает, откуда приходят люди и где они бросают
        регистрацию или отклик. Вебвизор записывает движения мыши и прокрутку, но не пароли, переписку и контакты: эти
        блоки скрыты от записи. Данные обрабатывает ООО «Яндекс».
      </p>
      <CookieTable rows={ANALYTICS} />
      <ConsentSwitch />
      <p className="mt-4 text-sm text-muted-foreground">
        Свой выбор мы храним в localStorage вашего браузера, на сервер он не уходит.
      </p>
      <p className="mt-10 text-muted-foreground">
        Как мы обрабатываем персональные данные, написано в{" "}
        <Link href="/privacy" className="font-semibold text-brand-ink underline underline-offset-2 hover:text-brand-hover">
          политике конфиденциальности
        </Link>
        .
      </p>
    </Container>
  );
}
