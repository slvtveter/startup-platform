import { Container } from "@/components/domain/page-header";
import { cn } from "@/lib/utils";

/**
 * Заглушки для loading.tsx. Повторяют сетку настоящих страниц (контейнер, заголовок, колонки, высоты),
 * чтобы при подмене на контент ничего не прыгало: в #85 скелетоны убрали именно за «прыжок».
 * Без пульсации: ровные плашки цвета tone, проявляются с задержкой 150 мс — на быстрых
 * переходах их не видно вовсе.
 */
function Bar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("rounded-lg bg-tone", className)} style={style} />;
}

function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Container className={className}>
      <div role="status" aria-label="Загружаем страницу" className="skeleton-in">
        {children}
      </div>
    </Container>
  );
}

/** Заголовок страницы как в PageHeader: h1 32/48 px и строка описания. */
function Header({ description = true, actions = false }: { description?: boolean; actions?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <Bar className="h-[34px] w-64 max-w-full sm:h-[50px] sm:w-96" />
        {description && <Bar className="mt-3 h-7 w-full max-w-xl" />}
      </div>
      {actions && <Bar className="h-11 w-44 shrink-0 rounded-lg" />}
    </div>
  );
}

/** Обычная страница: заголовок и несколько блоков. Запасной вариант для всех разделов (app/loading.tsx). */
export function PageSkeleton({ narrow = false, blocks = 3 }: { narrow?: boolean; blocks?: number }) {
  return (
    <Shell className={narrow ? "max-w-4xl" : undefined}>
      <Header />
      <div className="mt-8 grid gap-3">
        {Array.from({ length: blocks }, (_, i) => (
          <Bar key={i} className="h-28 rounded-[28px] sm:h-32" />
        ))}
      </div>
    </Shell>
  );
}

/** Каталог стартапов или людей: заголовок, фильтры колонкой слева (lg), карточки на всю ширину. */
export function CatalogSkeleton({ people = false }: { people?: boolean }) {
  return (
    <Shell>
      <Header description={false} actions={!people} />
      <div className="-mx-4 mt-6 flex gap-1.5 overflow-hidden px-4 lg:hidden">
        {[96, 120, 88, 132].map((w) => (
          <Bar key={w} className="h-11 shrink-0 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="mt-4 lg:mt-10 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <div className="hidden lg:block">
          <Bar className="mt-2.5 h-6 w-24" />
          {[5, 6, 3].map((n, g) => (
            <div key={g} className="mt-9 grid gap-4">
              <Bar className="h-5 w-20" />
              {Array.from({ length: n }, (_, i) => (
                <Bar key={i} className="h-5 w-full" />
              ))}
            </div>
          ))}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <Bar className={cn("h-11 rounded-full", people ? "w-full max-w-[740px]" : "flex-1")} />
            {!people && <Bar className="h-6 w-40 max-sm:hidden" />}
          </div>
          <Bar className="mt-6 h-6 w-40" />
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 4 }, (_, i) => (people ? <PersonRow key={i} /> : <StartupRow key={i} />))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function StartupRow() {
  return (
    <div className="rounded-3xl bg-tone p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="size-14 shrink-0 rounded-2xl bg-tone-2" />
        <div className="flex-1">
          <div className="h-6 w-48 max-w-full rounded-lg bg-tone-2" />
          <div className="mt-2 h-4 w-32 rounded-lg bg-tone-2" />
        </div>
      </div>
      <div className="mt-4 h-5 w-full max-w-2xl rounded-lg bg-tone-2" />
      <div className="mt-4 flex gap-1.5">
        <div className="h-7 w-36 rounded-full bg-white" />
        <div className="h-7 w-28 rounded-full bg-white" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-tone-2 pt-4">
        <div className="h-7 w-36 rounded-full bg-tone-2" />
        <div className="h-5 w-40 rounded-lg bg-tone-2" />
      </div>
    </div>
  );
}

/** Карточка человека как резюме: фото, роль и имя, строки «Опыт / О себе / Навыки». */
function PersonRow() {
  return (
    <div className="max-w-[1000px] rounded-3xl bg-tone p-4 sm:p-6">
      <div className="flex gap-4">
        <div className="size-16 shrink-0 rounded-2xl bg-tone-2 sm:size-24" />
        <div className="flex-1 self-center">
          <div className="h-7 w-40 rounded-lg bg-tone-2" />
          <div className="mt-2 h-5 w-56 max-w-full rounded-lg bg-tone-2" />
          <div className="mt-3 flex gap-1.5">
            <div className="h-6 w-20 rounded-full bg-white" />
            <div className="h-6 w-28 rounded-full bg-white" />
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-4 border-t border-tone-2 pt-4">
        {[48, 64, 56].map((w, i) => (
          <div key={i} className="flex gap-6">
            <div className="h-5 w-16 shrink-0 rounded-lg bg-tone-2" />
            <div className="h-5 rounded-lg bg-tone-2" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Страница стартапа: ссылка назад, шапка в две колонки (текст и обложка 16:10), ниже места и колонка справа. */
export function StartupSkeleton() {
  return (
    <Shell className="pb-28 lg:pb-10">
      <Bar className="h-5 w-28" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
        <div>
          <div className="flex gap-2">
            <Bar className="h-7 w-14 rounded-full" />
            <Bar className="h-7 w-28 rounded-full" />
          </div>
          <Bar className="mt-4 h-[38px] w-2/3 sm:h-[58px]" />
          <Bar className="mt-4 h-7 w-full max-w-[46ch]" />
          <Bar className="mt-6 h-10 w-64" />
          <Bar className="mt-6 h-[52px] w-56" />
        </div>
        <Bar className="aspect-[16/10] w-full rounded-[28px] sm:rounded-[36px]" />
      </div>
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <Bar className="h-[34px] w-64 sm:h-10" />
          <Bar className="mt-6 h-64 rounded-[28px]" />
        </div>
        <Bar className="h-44 rounded-[28px]" />
      </div>
    </Shell>
  );
}

/** Профиль человека: фото и имя внизу справа от него, текст, колонка условий справа (lg). */
export function PersonSkeleton() {
  return (
    <Shell>
      <Bar className="h-5 w-24" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-end md:grid-cols-[280px_minmax(0,1fr)]">
            <Bar className="aspect-square w-full max-w-[280px] rounded-[28px]" />
            <div>
              <Bar className="h-[38px] w-2/3 sm:h-[50px]" />
              <Bar className="mt-3 h-6 w-72 max-w-full" />
            </div>
          </div>
          <Bar className="mt-8 h-7 w-96 max-w-full" />
          <Bar className="mt-4 h-5 w-full max-w-xl" />
          <Bar className="mt-2 h-5 w-2/3 max-w-md" />
          <Bar className="mt-10 h-9 w-40" />
          <div className="mt-4 flex gap-2">
            {[56, 112, 128, 160].map((w) => (
              <Bar key={w} className="h-7 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>
        <Bar className="h-64 rounded-[28px] max-lg:hidden" />
      </div>
    </Shell>
  );
}

/** Форма: профиль, настройки, мастер стартапа. */
export function FormSkeleton({ narrow = false }: { narrow?: boolean }) {
  return (
    <Shell className={narrow ? "max-w-5xl" : undefined}>
      <Header />
      <div className="mt-8 grid max-w-2xl gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Bar className="h-5 w-32" />
            <Bar className={cn("mt-2 w-full", i === 2 ? "h-28" : "h-11")} />
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Статья гайда: узкая колонка текста. */
export function ArticleSkeleton() {
  return (
    <Shell>
      <div className="max-w-3xl">
        <Bar className="h-5 w-24" />
        <Bar className="mt-6 h-[38px] w-full sm:h-[50px]" />
        <Bar className="mt-2 h-[38px] w-2/3 sm:h-[50px]" />
        <div className="mt-8 grid gap-3">
          {[100, 96, 92, 100, 70].map((w, i) => (
            <Bar key={i} className="h-5" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** Переписка внутри layout чатов: список слева на широком экране уже нарисован, здесь — лента. */
export function ThreadSkeleton() {
  return (
    <div role="status" aria-label="Загружаем переписку" className="skeleton-in grid content-end gap-3 p-6">
      {[60, 44, 70, 38].map((w, i) => (
        <Bar key={i} className={cn("h-12 rounded-2xl", i % 2 && "ml-auto")} style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
