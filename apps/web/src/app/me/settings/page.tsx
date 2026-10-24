import { Container, PageHeader } from "@/components/domain/page-header";
import { SettingsPanel } from "@/components/domain/settings-panel";
import { requireMe } from "@/lib/server-api";

export const metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const user = await requireMe("/me/settings");
  return (
    <Container className="max-w-3xl">
      <PageHeader title="Настройки" description="Вход через GitHub, VK ID, Яндекс и Telegram появится в следующих версиях." />
      <div className="mt-8">
        <SettingsPanel email={user.email} verified={user.email_verified} />
      </div>
    </Container>
  );
}
