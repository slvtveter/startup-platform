"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { publishMyProfile } from "@/lib/api";
import { apiCode, errorMessage } from "@/lib/errors";

type Result = { ok: true } | { ok: false; message: string };

/**
 * Публикация профиля с отдельным согласием (ст. 10.1 152-ФЗ). Сначала пробуем без галочки: если
 * согласие уже есть, профиль публикуется сразу. Иначе открываем окно с пустой галочкой и ссылкой
 * на полный текст; согласие пишется в журнал на сервере.
 */
export function usePublishWithConsent() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const resolver = useRef<((r: Result) => void) | null>(null);

  const publish = useCallback(async (): Promise<Result> => {
    const { error: err } = await publishMyProfile({ body: { published: true } });
    if (!err) return { ok: true };
    if (apiCode(err) !== "publication_consent_required") return { ok: false, message: errorMessage(err) };
    setChecked(false);
    setError("");
    setOpen(true);
    return new Promise<Result>((resolve) => (resolver.current = resolve));
  }, []);

  function close(r: Result) {
    setOpen(false);
    resolver.current?.(r);
    resolver.current = null;
  }

  async function confirm() {
    if (!checked) return setError("Отметь галочку, чтобы опубликовать профиль");
    setBusy(true);
    const { error: err } = await publishMyProfile({ body: { published: true, consent: true } });
    setBusy(false);
    if (err) return setError(errorMessage(err));
    close({ ok: true });
  }

  const dialog = (
    <Dialog open={open} onOpenChange={(o) => !o && close({ ok: false, message: "" })}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Согласие на публикацию профиля</DialogTitle>
          <DialogDescription>
            Профиль увидят все посетители каталога людей. Почта, телефон и переписка не публикуются, а что не заполнено в профиле, то и не
            показывается.
          </DialogDescription>
        </DialogHeader>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="size-6 shrink-0 accent-[var(--brand)]"
            aria-describedby={error ? "pub-error" : undefined}
          />
          <span>
            Даю отдельное согласие на распространение сведений моего профиля на условиях{" "}
            <Link href="/profile/publication-consent" target="_blank" className="inline-flex min-h-6 items-center font-semibold text-brand-ink underline underline-offset-2">
              согласия
            </Link>
          </span>
        </label>
        {error && (
          <p id="pub-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => close({ ok: false, message: "" })}>
            Не сейчас
          </Button>
          <Button variant="brand" onClick={confirm} disabled={busy} aria-busy={busy}>
            Опубликовать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { publish, dialog };
}
