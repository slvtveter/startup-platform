import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { SocialButtons } from "@/components/auth/social-buttons";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <AuthCard tab="login" next={next} title={"С возвращением"} subtitle="Войди по почте и паролю, с которыми регистрировался.">
      {error === "vk" && <p className="mb-4 rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">Не получилось войти через VK ID. Попробуй ещё раз или войди по почте.</p>}
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
      <div className="mt-4">
        <SocialButtons />
      </div>
    </AuthCard>
  );
}
