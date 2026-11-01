import { Container } from "@/components/domain/page-header";

/** Первый вход в админку: скелетон шапки, вкладок и плиток, пока сервер собирает данные. */
export default function Loading() {
  return (
    <Container>
      <div aria-busy="true" aria-label="Загрузка" className="animate-pulse">
        <div className="h-12 w-56 rounded-xl bg-tone" />
        <div className="mt-6 flex gap-2 border-b pb-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-6 w-24 rounded-lg bg-tone" />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-tone" />
          ))}
        </div>
        <div className="mt-4 h-56 rounded-2xl bg-tone" />
      </div>
    </Container>
  );
}
