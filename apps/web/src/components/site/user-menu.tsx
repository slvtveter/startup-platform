"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/api";
import { initials } from "@/lib/labels";

export function UserMenu({ email, name, isAdmin }: { email: string; name: string; isAdmin: boolean }) {
  const router = useRouter();
  const items = [
    { href: "/me/profile", label: "Мой профиль" },
    { href: "/me/applications", label: "Мои заявки" },
    { href: "/me/startups", label: "Мои стартапы" },
    { href: "/me/settings", label: "Настройки" },
    ...(isAdmin ? [{ href: "/admin", label: "Админка" }] : []),
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Меню аккаунта">
        <Avatar className="size-9">
          <AvatarFallback className="bg-foreground text-sm font-bold text-background">{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((i) => (
          <DropdownMenuItem key={i.href} render={<Link href={i.href} />}>
            {i.label}
          </DropdownMenuItem>
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
