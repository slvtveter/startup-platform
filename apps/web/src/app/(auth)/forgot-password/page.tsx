import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata = { title: "Восстановление пароля" };

export default function ForgotPage() {
  return (
    <AuthCard title="Забыли пароль?" subtitle="Пришлём на почту код, по нему задашь новый пароль и сразу войдёшь.">
      <Suspense>
        <ForgotForm />
      </Suspense>
    </AuthCard>
  );
}
