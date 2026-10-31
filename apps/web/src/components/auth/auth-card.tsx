import { Check } from "lucide-react";
import Image from "next/image";

import { AuthFrame } from "@/components/auth/auth-frame";
import { PHOTOS } from "@/lib/photos";

/**
 * Рамка раздела входа (app/(auth)/layout.tsx): слева карточка (AuthFrame), справа фото с коротким
 * обещанием. Живёт в layout, поэтому при переходе «Вход ⇄ Регистрация»
 * ничего не перерисовывается: карточка плавно меняет высоту, меняется только форма внутри.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1360px] gap-3 px-4 pt-2 pb-12 sm:px-6 lg:min-h-[calc(100svh-84px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-10">
      {/* Карточка прижата к верху, а не по центру: разная высота входа и регистрации не двигает вкладки. */}
      <div className="flex items-start justify-center rounded-[28px] bg-tone px-4 py-10 sm:rounded-[36px] sm:py-16 lg:pt-[max(64px,10vh)]">
        <div className="w-full max-w-[420px]">
          <AuthFrame>{children}</AuthFrame>
        </div>
      </div>
      <div className="relative isolate hidden overflow-hidden rounded-[36px] p-10 text-white lg:flex lg:flex-col lg:justify-end">
        <Image src={PHOTOS.videoCall} alt="" fill preload placeholder="blur" sizes="50vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_18_34/0.1),rgb(10_18_34/0.78))]" />
        <p className="max-w-[18ch] text-[36px] leading-[1.02] font-extrabold tracking-[-0.04em]">Здесь стартапы начинаются с разговора</p>
        <ul className="mt-5 grid gap-2 text-base font-semibold text-white/90">
          {["Бесплатно и без резюме", "Профиль за пару минут"].map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <span aria-hidden className="grid size-5 place-items-center rounded-full bg-white/20">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Содержимое карточки входа: заголовок, подзаголовок и форма. Сама карточка с вкладками — AuthFrame в layout. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <>
      <h1 className="text-[32px] leading-[1.05] sm:text-[36px]">{title}</h1>
      {subtitle && <p className="mt-2.5 text-muted-foreground">{subtitle}</p>}
      <div className="mt-7">{children}</div>
    </>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-destructive">
      {message}
    </p>
  );
}
