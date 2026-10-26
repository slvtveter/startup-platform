import { Container } from "@/components/domain/page-header";

/** Серый контур будущего контента: появляется сразу после клика, пока сервер готовит страницу. */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-secondary ${className}`} />;
}

export function ListSkeleton() {
  return (
    <Container>
      <div role="status" aria-label="Загружаем">
        <Bar className="h-10 w-56" />
        <Bar className="mt-4 h-4 w-full max-w-xl" />
        <Bar className="mt-8 h-11 w-full" />
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-2xl border p-5">
              <Bar className="h-5 w-2/3" />
              <Bar className="mt-3 h-4 w-full" />
              <Bar className="mt-2 h-4 w-4/5" />
              <Bar className="mt-6 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

export function DetailSkeleton() {
  return (
    <Container>
      <div role="status" aria-label="Загружаем">
        <Bar className="h-4 w-28" />
        <Bar className="mt-8 h-12 w-2/3 max-w-lg" />
        <Bar className="mt-4 h-5 w-full max-w-2xl" />
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Bar className="h-40 w-full rounded-2xl" />
            <Bar className="h-40 w-full rounded-2xl" />
          </div>
          <Bar className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    </Container>
  );
}
