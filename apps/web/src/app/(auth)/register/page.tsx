import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { SocialButtons } from "@/components/auth/social-buttons";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <AuthCard title="Создать аккаунт">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
      <div className="mt-4">
        <SocialButtons />
      </div>
    </AuthCard>
  );
}
