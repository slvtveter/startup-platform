import { Container } from "@/components/domain/page-header";

export const metadata = { title: "Cookie и данные" };

const COOKIES = [
  { name: "session", why: "Вход в аккаунт. Без неё сайт не узнает вас после входа", ttl: "30 дней или до выхода" },
];

/** KAN-130: какие cookie ставит сайт. Аналитику подключим только с согласием (KAN-132). */
export default function CookiesPage() {
  return (
    <Container className="max-w-2xl py-16">
      <h1 className="text-3xl font-bold">Cookie и данные</h1>
      <p className="mt-4 text-muted-foreground">
        Cookie — небольшая запись, которую сайт сохраняет в браузере. Мы используем только необходимые cookie. Рекламы,
        счётчиков и сторонних трекеров на сайте нет.
      </p>
      <div className="mt-8 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="p-3 font-semibold">Имя</th>
              <th className="p-3 font-semibold">Зачем</th>
              <th className="p-3 font-semibold">Срок</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES.map((c) => (
              <tr key={c.name} className="border-t">
                <td className="p-3 font-mono">{c.name}</td>
                <td className="p-3">{c.why}</td>
                <td className="p-3 whitespace-nowrap">{c.ttl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Cookie сессии недоступна скриптам на странице и передаётся только по HTTPS. Удалить её можно, выйдя из аккаунта или
        очистив данные сайта в настройках браузера. Отметку о том, что вы закрыли сообщение о cookie, мы храним в
        localStorage вашего браузера, на сервер она не уходит.
      </p>
    </Container>
  );
}
