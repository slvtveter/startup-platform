import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { health } from "@/lib/api";
import { serverClient } from "@/lib/server-api";

async function ApiStatus() {
  const { data, error } = await health({ client: serverClient });
  if (error || !data) return <Badge variant="destructive">API недоступно</Badge>;
  return (
    <div className="flex gap-2">
      <Badge>API: {data.status}</Badge>
      <Badge variant={data.db === "ok" ? "secondary" : "destructive"}>DB: {data.db}</Badge>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Startup Platform</h1>
        <p className="text-muted-foreground text-lg">
          Стажёры и выпускники находят первый реальный опыт, а основатели — команду для своей
          идеи.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Люди</CardTitle>
            <CardDescription>Профили, навыки и портфолио участников</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Скоро</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Стартапы</CardTitle>
            <CardDescription>Проекты, которые ищут участников</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Скоро</CardContent>
        </Card>
      </div>

      <Suspense fallback={<Badge variant="outline">Проверяем API…</Badge>}>
        <ApiStatus />
      </Suspense>
    </main>
  );
}
