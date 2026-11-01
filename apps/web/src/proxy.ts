import { NextResponse, type NextRequest } from "next/server";

/**
 * Личные разделы без сессии: сразу на вход (раньше гость секунду видел пустую страницу, пока
 * серверный requireMe не сделает редирект). Проверяем только наличие cookie — саму сессию
 * проверяет API; просроченная cookie по-прежнему уйдёт на вход через requireMe.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has("session")) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const url = new URL("/login", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/me/:path*", "/chats/:path*", "/admin/:path*", "/welcome"],
};
