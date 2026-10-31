"use client";

import { LogOut, Rocket, Send, Settings, Shield, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type Item = { href: string; label: string; icon: LucideIcon; badge?: number };

/**
 * Меню аккаунта: всё личное (отклики, стартапы, настройки) живёт здесь, а не в шапке.
 * Точка на аватаре — есть непрочитанное, счётчик — у нужного пункта.
 */
export function UserMenu({
  email,
  name,
  avatarUrl,
  isAdmin,
  inbox,
}: {
  email: string;
  name: string;
  /** Фото из профиля; без него — инициалы. */
  avatarUrl?: string | null;
  isAdmin: boolean;
  inbox: { mine: number; incoming: number };
}) {
  const router = useRouter();
  const unread = inbox.mine + inbox.incoming;
  const groups: Item[][] = [
    [
      { href: "/me/profile", label: "Мой профиль", icon: UserRound },
      { href: "/me/applications", label: "Мои отклики", icon: Send, badge: inbox.mine },
      { href: "/me/startups", label: "Мои стартапы", icon: Rocket, badge: inbox.incoming },
    ],
    [
      { href: "/me/settings", label: "Настройки", icon: Settings },
      ...(isAdmin ? [{ href: "/admin", label: "Админка", icon: Shield }] : []),
    ],
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`Меню аккаунта ${initials(name)}${unread ? `, новых событий: ${unread}` : ""}`}
      >
        <Avatar className="size-9">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" className="object-cover" />}
          <AvatarFallback className="bg-second text-sm font-bold text-on-second">{initials(name)}</AvatarFallback>
        </Avatar>
        {unread > 0 && (
          <span aria-hidden className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-brand" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
            <Avatar className="size-9 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" className="object-cover" />}
              <AvatarFallback className="bg-second text-sm font-bold text-on-second">{initials(name)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-foreground">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {groups.map((g, gi) => (
          <DropdownMenuGroup key={gi}>
            <DropdownMenuSeparator />
            {g.map((i) => (
              <DropdownMenuItem key={i.href} render={<Link href={i.href} />} className="gap-2.5 px-2 py-2">
                <i.icon aria-hidden className="size-4 text-muted-foreground" />
                {i.label}
                {i.badge ? (
                  <span className="ml-auto rounded-full bg-brand px-1.5 text-xs font-semibold text-white">{i.badge}</span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2.5 px-2 py-2"
          onClick={async () => {
            await logout();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut aria-hidden className="size-4 text-muted-foreground" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
