"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { PublishCheck, TermsNote, type TermsState } from "@/components/auth/terms-checks";
import { Button } from "@/components/ui/button";
import { acceptTerms, logout } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Сами документы читаются и без согласия. */
const OPEN = ["/terms", "/privacy", "/cookies", "/profile/publication-consent"];

/**
 * Вошедший без согласия с действующей редакцией соглашения (вход через соцсети, старый аккаунт,
 * новая редакция) видит вместо страницы этот экран. Согласие пишется в журнал на сервере.
 */
export function TermsGate({ needed, children }: { needed: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [value, setValue] = useState<TermsState>({ publish: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!needed || OPEN.includes(pathname)) return children;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await acceptTerms({ body: { accept_terms: true, adult: true, publish_consent: value.publish } });
    if (res.error) {
      setBusy(false);
      return setError(errorMessage(res.error));
    }
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pt-2 pb-12 sm:px-6 lg:px-10">
      <div className="flex justify-center rounded-[28px] bg-tone px-4 py-12 sm:rounded-[36px] sm:py-20">
        <form onSubmit={submit} noValidate className="w-full max-w-[420px] rounded-[28px] bg-white p-6 sm:p-8">
          <h1 className="text-[32px] leading-[1.05]">Последний шаг</h1>
          <p className="mt-2.5 text-muted-foreground">Прими условия Envola, чтобы продолжить.</p>
          <div className="mt-7">
            <PublishCheck value={value} onChange={setValue} />
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" variant="brand" size="lg" disabled={busy} aria-busy={busy} className="mt-6 w-full">
            {busy && <Loader2 aria-hidden className="size-5 animate-spin" />}
            Продолжить
          </Button>
          <div className="mt-3">
            <TermsNote action="Продолжить" />
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/");
              router.refresh();
            }}
            className="mt-3 w-full py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Выйти
          </button>
        </form>
      </div>
    </div>
  );
}
