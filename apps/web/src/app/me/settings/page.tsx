import { BellIcon, ShieldCheckIcon, UserRoundIcon, UserRoundXIcon } from "lucide-react";

import { EmailPrefs } from "@/components/domain/email-prefs";
import { Container, PageHeader } from "@/components/domain/page-header";
import { AccountSettings, ProfileSettings, SecuritySettings, SessionsSettings, SettingsCard } from "@/components/domain/settings-panel";
import { getEmailPrefs, getMyProfile, listSessions } from "@/lib/api";
import { requireMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Настройки" };

const SECTIONS = [
  { id: "profile", label: "Профиль", icon: UserRoundIcon },
  { id: "notifications", label: "Уведомления", icon: BellIcon },
  { id: "security", label: "Безопасность", icon: ShieldCheckIcon },
  { id: "account", label: "Аккаунт", icon: UserRoundXIcon },
];

export default async function SettingsPage() {
  const user = await requireMe("/me/settings");
  const client = await serverClient();
  const [{ data: prefs }, { data: profile }, { data: sessions }] = await Promise.all([
    getEmailPrefs({ client }),
    getMyProfile({ client }),
    listSessions({ client }),
  ]);
  return (
    <Container className="max-w-5xl">
      <PageHeader title="Настройки" description="Видимость профиля, письма, вход в аккаунт и устройства." />
      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_1fr]">
        {/* На десктопе — оглавление сбоку, на телефоне — ряд ссылок над разделами. */}
        <nav aria-label="Разделы настроек" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <s.icon aria-hidden className="size-4" />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid min-w-0 gap-6">
          {profile && (
            <ProfileSettings
              slug={profile.slug}
              published={profile.is_published}
              canPublish={profile.can_publish}
              missing={profile.missing}
              showEmail={profile.show_email}
            />
          )}
          <EmailPrefs initial={prefs ?? []} />
          <SettingsCard id="security" title="Безопасность" description="Почта и пароль для входа, активные сеансы.">
            <SecuritySettings email={user.email} verified={user.email_verified} />
            <SessionsSettings sessions={sessions ?? []} />
          </SettingsCard>
          <AccountSettings email={user.email} />
        </div>
      </div>
    </Container>
  );
}
