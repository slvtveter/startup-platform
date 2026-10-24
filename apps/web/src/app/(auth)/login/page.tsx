import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <AuthCard title="С возвращением" subtitle="Войди, чтобы откликаться на роли и управлять стартапами.">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthCard>
  );
}
