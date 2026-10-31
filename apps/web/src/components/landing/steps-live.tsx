"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { PersonCard as Person } from "@/lib/api";
import { cn } from "@/lib/utils";

/*
 * «Как попасть в команду» с живыми кусочками интерфейса. Один цикл 7 с, все три шага в одной фазе,
 * чтобы читались слева направо: навыки добавляются → фильтры появляются и выбирается роль →
 * кнопку нажимают и появляется «Отклик отправлен». Запускается, когда блок попал в экран.
 * prefers-reduced-motion: сразу итоговое состояние без движения.
 */

const STEPS = [
  { title: "Создай профиль", text: "Роль, навыки и свободные часы в неделю. Резюме не нужно.", href: "/register" },
  { title: "Выбери стартап", text: "Фильтр по роли, стадии и оплате.", href: "/startups" },
  { title: "Откликнись и созвонись", text: "Обсуди с основателем задачи и сроки.", href: "/register" },
];

const CSS = `
.steps-live .a { opacity: 1; }
.steps-live.play .a { animation-duration: 7s; animation-iteration-count: infinite; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); animation-fill-mode: both; }
.steps-live.play .chip { animation-name: sl-chip; }
.steps-live.play .row { animation-name: sl-row; }
.steps-live.play .pick { animation-name: sl-pick; }
.steps-live.play .dot { animation-name: sl-dot; }
.steps-live.play .press { animation-name: sl-press; }
.steps-live.play .sent { animation-name: sl-sent; }
@keyframes sl-chip { 0%, 8% { opacity: 0; transform: scale(0.6); } 16%, 90% { opacity: 1; transform: none; } 97%, 100% { opacity: 0; transform: none; } }
@keyframes sl-row { 0%, 6% { opacity: 0; transform: translateY(8px); } 14%, 90% { opacity: 1; transform: none; } 97%, 100% { opacity: 0; } }
@keyframes sl-pick { 0%, 38% { background: var(--tone); color: var(--foreground); } 44%, 90% { background: var(--brand-soft); color: var(--brand-ink); } 97%, 100% { background: var(--tone); } }
@keyframes sl-dot { 0%, 38% { background: #fff; border-color: var(--input); } 44%, 90% { background: var(--brand); border-color: var(--brand); } 97%, 100% { background: #fff; } }
@keyframes sl-press { 0%, 30% { transform: none; } 33% { transform: scale(0.95); } 37%, 100% { transform: none; } }
@keyframes sl-sent { 0%, 36% { opacity: 0; transform: translateY(6px); } 44%, 90% { opacity: 1; transform: none; } 97%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .steps-live.play .a { animation: none !important; } }
`;

const d = (ms: number) => ({ animationDelay: `${ms}ms` });

export function StepsLive({ role, person }: { role?: string; person?: Person }) {
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPlay(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const skills = person?.skills?.slice(0, 3).map((s) => s.name) ?? ["Figma", "UX", "Прототипы"];
  return (
    <div ref={ref} className={cn("steps-live grid gap-3 md:grid-cols-3", play && "play")}>
      <style>{CSS}</style>

      <Panel i={0}>
        <div className="w-full max-w-[280px]">
          <div className="flex items-center gap-3">
            {person?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
              <img src={person.avatar_url} alt="" className="size-11 rounded-xl object-cover" />
            ) : (
              <span className="size-11 rounded-xl bg-brand-soft" />
            )}
            <span className="grid gap-1">
              <b className="text-base font-bold">{person?.primary_role?.name ?? "Дизайнер"}</b>
              <span className="text-sm text-muted-foreground">8–12 часов в неделю</span>
            </span>
          </div>
          <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
            {skills.map((t, k) => (
              <span key={t} className="a chip rounded-full bg-tone px-2.5 py-1 text-xs font-semibold" style={d(k * 350)}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </Panel>

      <Panel i={1}>
        <div className="grid w-full max-w-[280px] gap-2">
          {["Стадия: MVP", "Оплачивается", `Ищут: ${role ?? "Дизайнер"}`].map((t, k) => (
            <span
              key={t}
              className={cn("a row flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold", k === 2 ? "pick bg-brand-soft text-brand-ink" : "bg-tone")}
              style={d(k * 220)}
            >
              <span className="truncate">{t}</span>
              <span aria-hidden className={cn("size-4 shrink-0 rounded-full border-[1.5px]", k === 2 ? "a dot border-brand bg-brand" : "border-input bg-white")} />
            </span>
          ))}
        </div>
      </Panel>

      <Panel i={2}>
        <div className="grid w-full max-w-[280px] gap-3">
          <span className="a press inline-flex h-11 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">Откликнуться</span>
          <span className="a sent flex items-center justify-center gap-2 text-sm font-semibold text-success-ink">
            <span aria-hidden className="size-2 rounded-full bg-success-ink" />
            Отклик отправлен
          </span>
        </div>
      </Panel>
    </div>
  );
}

/** Шаг — ссылка: «Создай профиль» и «Откликнись» ведут в регистрацию, «Выбери стартап» — в каталог. */
function Panel({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <Link href={STEPS[i].href} className="card-hover group flex flex-col rounded-[28px] bg-tone p-2 hover:bg-tone-2">
      <div aria-hidden className="grid h-44 place-items-center rounded-[20px] bg-white px-6">
        {children}
      </div>
      <div className="px-5 pt-5 pb-6">
        <p className="text-sm font-bold text-brand-ink">Шаг {i + 1}</p>
        <h3 className="mt-1.5 text-2xl font-extrabold tracking-[-0.03em] transition-colors group-hover:text-brand-ink">{STEPS[i].title}</h3>
        <p className="mt-2 text-muted-foreground">{STEPS[i].text}</p>
      </div>
    </Link>
  );
}
