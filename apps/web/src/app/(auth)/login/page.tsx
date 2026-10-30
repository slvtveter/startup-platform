import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { SocialButtons } from "@/components/auth/social-buttons";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthCard title="С возвращением">
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
