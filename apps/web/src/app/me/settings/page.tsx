import { Container, PageHeader } from "@/components/domain/page-header";
import { EmailPrefs } from "@/components/domain/email-prefs";
import { SettingsPanel } from "@/components/domain/settings-panel";
import { getEmailPrefs } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const user = await requireMe("/me/settings");
  const { data: prefs } = await getEmailPrefs({ client: await serverClient() });
  return (
    <Container className="max-w-3xl">
      <PageHeader title="Настройки" description="Вход через GitHub, VK ID, Яндекс и Telegram появится в следующих версиях." />
      <div className="mt-8 grid gap-6">
        <EmailPrefs initial={prefs ?? []} />
        <SettingsPanel email={user.email} verified={user.email_verified} />
      </div>
    </Container>
  );
}
