import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { buttonVariants } from "@/components/ui/button";
import { verifyEmail } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { serverClient } from "@/lib/server-api";

export const metadata = { title: "Подтверждение email" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const { error } = await verifyEmail({ client: await serverClient(), body: { token } });
  return (
    <AuthCard title={error ? "Ссылка не сработала" : "Email подтверждён"}>
      <p className="text-muted-foreground">
        {error ? errorMessage(error) : "Теперь можно опубликовать профиль и откликаться на роли в стартапах."}
      </p>
      <Link href={error ? "/me/settings" : "/me/profile"} className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}>
        {error ? "Отправить письмо ещё раз" : "К профилю"}
      </Link>
    </AuthCard>
  );
}
