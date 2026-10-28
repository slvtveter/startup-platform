import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { SocialButtons } from "@/components/auth/social-buttons";

export const metadata: Metadata = { title: "Регистрация" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthCard tab="register" next={next} title="Создать аккаунт" subtitle="Бесплатно и без резюме. Почту подтвердим кодом, профиль заполним на следующем шаге.">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
      <div className="mt-4">
        <SocialButtons />
      </div>
    </AuthCard>
  );
}
