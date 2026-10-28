import { redirect } from "next/navigation";

/** /me — это профиль: короткий адрес из подсказок и старых ссылок. */
export default function MePage() {
  redirect("/me/profile");
}
