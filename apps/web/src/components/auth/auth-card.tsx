import Image from "next/image";

/** Вход и регистрация: форма слева, справа фото с репликой — тот же «разговор», что на главной. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1360px] gap-3 px-4 pt-2 pb-12 sm:px-6 lg:min-h-[calc(100svh-84px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-10">
      <div className="grid place-items-center rounded-[28px] bg-tone px-4 py-10 sm:rounded-[36px] sm:py-16">
        <div className="w-full max-w-[420px] rounded-[28px] bg-card p-6 shadow-[0_24px_60px_-30px_rgb(15_27_45/0.25)] sm:p-9">
          <h1 className="text-[30px] leading-[1.05] sm:text-[36px]">{title}</h1>
          {subtitle && <p className="mt-2.5 text-muted-foreground">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </div>
      <div className="relative isolate hidden overflow-hidden rounded-[36px] p-10 text-white lg:flex lg:flex-col lg:justify-end">
        <Image src="/img/video-call.jpg" alt="" fill sizes="50vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_18_34/0.1),rgb(10_18_34/0.78))]" />
        <div className="flex max-w-[400px] items-end gap-2.5">
          <Image src="/img/a-kirill.jpg" alt="" width={36} height={36} className="size-9 rounded-full object-cover shadow-[0_0_0_2px_rgb(255_255_255/0.8)]" />
          <p className="rounded-[18px] rounded-bl-md bg-white px-3.5 py-2.5 text-[15px] leading-snug text-foreground shadow-[0_14px_40px_rgb(0_0_0/0.25)]">
            <small className="mb-0.5 block text-xs font-bold text-muted-foreground">Кирилл, frontend</small>
            Привет! Видел твою идею, могу взять на себя фронт. Созвонимся?
          </p>
        </div>
        <p className="mt-8 max-w-[18ch] text-[40px] leading-[1.02] font-extrabold tracking-[-0.04em]">Здесь стартапы начинаются с разговора</p>
      </div>
    </div>
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
