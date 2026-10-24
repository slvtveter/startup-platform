import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { buttonVariants } from "@/components/ui/button";
import { confirmEmailChange } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { serverClient } from "@/lib/server-api";

export const metadata = { title: "Новый адрес почты", robots: { index: false } };

// KAN-72: переход по ссылке из письма на новый адрес делает его основным.
export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const { error } = await confirmEmailChange({ client: await serverClient(), body: { token } });
  return (
    <AuthCard title={error ? "Ссылка не сработала" : "Почта изменена"}>
      <p className="text-muted-foreground">
        {error ? errorMessage(error) : "Теперь входите по новому адресу. Письма тоже будут приходить на него."}
      </p>
      <Link href="/me/settings" className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}>
        К настройкам
      </Link>
    </AuthCard>
  );
}
