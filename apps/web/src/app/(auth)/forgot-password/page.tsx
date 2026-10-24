import { AuthCard } from "@/components/auth/auth-card";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata = { title: "Восстановление пароля" };

export default function ForgotPage() {
  return (
    <AuthCard title="Забыли пароль?" subtitle="Пришлём ссылку для нового пароля на почту.">
      <ForgotForm />
    </AuthCard>
  );
}
