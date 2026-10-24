"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/api";
import { initials } from "@/lib/labels";

type Item = { href: string; label: string; hint?: string; badge?: number };

/**
 * Меню аккаунта: всё личное (заявки, стартапы, настройки) живёт здесь, а не в шапке —
 * в шапке остаются только разделы каталога. Точка на аватаре — есть непрочитанное.
 */
export function UserMenu({
  email,
  name,
  isAdmin,
  inbox,
}: {
  email: string;
  name: string;
  isAdmin: boolean;
  inbox: { mine: number; incoming: number };
}) {
  const router = useRouter();
  const unread = inbox.mine + inbox.incoming;
  const groups: Item[][] = [
    [{ href: "/me/profile", label: "Мой профиль", hint: "Как тебя видят основатели" }],
    [
      { href: "/me/applications", label: "Мои отклики", hint: "Куда ты откликнулся и ответы", badge: inbox.mine },
      { href: "/me/startups", label: "Мои стартапы", hint: "Команда и входящие отклики", badge: inbox.incoming },
    ],
    [
      { href: "/me/settings", label: "Настройки" },
      ...(isAdmin ? [{ href: "/admin", label: "Админка" }] : []),
    ],
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={unread ? `Меню аккаунта, новых событий: ${unread}` : "Меню аккаунта"}
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-foreground text-sm font-bold text-background">{initials(name)}</AvatarFallback>
        </Avatar>
        {unread > 0 && (
          <span aria-hidden className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-brand" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate font-semibold text-foreground">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {groups.map((g, gi) => (
          <DropdownMenuGroup key={gi}>
            <DropdownMenuSeparator />
            {g.map((i) => (
              <DropdownMenuItem key={i.href} render={<Link href={i.href} />} className="items-start py-2">
                <span className="min-w-0">
                  <span className="block font-medium">{i.label}</span>
                  {i.hint && <span className="block text-xs text-muted-foreground">{i.hint}</span>}
                </span>
                {i.badge ? (
                  <span className="ml-auto rounded-full bg-brand px-1.5 text-xs font-semibold text-white">{i.badge}</span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await logout();
            router.push("/");
            router.refresh();
          }}
        >
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
