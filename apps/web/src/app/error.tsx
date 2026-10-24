"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Что-то сломалось</h1>
      <p className="mt-2 text-muted-foreground">Мы уже знаем об ошибке. Попробуй обновить страницу.</p>
      <Button className="mt-8" onClick={reset}>
        Попробовать ещё раз
      </Button>
    </div>
  );
}
