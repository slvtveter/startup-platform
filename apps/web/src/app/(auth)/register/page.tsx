import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <AuthCard title="Создать аккаунт" subtitle="Займёт минуту. Профиль заполним на следующем шаге.">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthCard>
  );
}
