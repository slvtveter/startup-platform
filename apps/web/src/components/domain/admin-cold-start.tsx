"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCatalogCreate,
  adminCatalogMerge,
  adminCatalogRename,
  adminCreatePlatformStartup,
  type PlatformStartupIn,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { STAGE, TERMS } from "@/lib/labels";

const select = "h-10 w-full rounded-lg border bg-card px-3 text-sm";

/** Перенос чужого проекта на платформу (KAN-75): права перейдут основателю, когда он подтвердит почту. */
export function PlatformStartupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    pitch: "",
    description: "",
    stage: "idea",
    terms: "equity",
    owner_email: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await adminCreatePlatformStartup({
      body: { ...form, stage: form.stage as PlatformStartupIn["stage"], terms: form.terms as PlatformStartupIn["terms"] },
    });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    toast.success(
      data!.is_owner
        ? "Черновик создан от имени платформы. Добавь места и опубликуй."
        : "Стартап сразу передан владельцу: он уже зарегистрирован.",
    );
    router.push(data!.is_owner ? `/startups/${data!.slug}/edit` : `/startups/${data!.slug}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="ps-title">Название</Label>
        <Input id="ps-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ps-email">Email основателя</Label>
        <Input id="ps-email" type="email" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="ps-pitch">Идея одной фразой</Label>
        <Input id="ps-pitch" value={form.pitch} onChange={(e) => set("pitch", e.target.value)} />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="ps-desc">Подробнее</Label>
        <Textarea id="ps-desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ps-stage">Стадия</Label>
        <select id="ps-stage" className={select} value={form.stage} onChange={(e) => set("stage", e.target.value)}>
          {Object.entries(STAGE).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ps-terms">Условия</Label>
        <select id="ps-terms" className={select} value={form.terms} onChange={(e) => set("terms", e.target.value)}>
          {Object.entries(TERMS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="brand" disabled={busy || form.title.trim().length < 2 || !form.owner_email.includes("@")}>
          Создать черновик
        </Button>
        <span className="text-sm text-muted-foreground">Права перейдут основателю, когда он подтвердит эту почту.</span>
      </div>
    </form>
  );
}

type Item = { slug: string; name: string };

/** Справочник ролей или навыков: добавить, переименовать, слить дубль в другой элемент. */
export function CatalogEditor({ kind, items }: { kind: "roles" | "skills"; items: Item[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [merging, setMerging] = useState<string | null>(null);
  const [into, setInto] = useState("");

  async function run(promise: Promise<{ error?: unknown }>, ok: string) {
    const { error } = await promise;
    if (error) return toast.error(errorMessage(error));
    toast.success(ok);
    setEditing(null);
    setMerging(null);
    setNewName("");
    router.refresh();
  }

  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(adminCatalogCreate({ path: { kind }, body: { name: newName } }), "Добавлено");
        }}
      >
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={kind === "roles" ? "Новая роль" : "Новый навык"} aria-label={kind === "roles" ? "Новая роль" : "Новый навык"} />
        <Button type="submit" variant="outline" disabled={newName.trim().length < 2}>
          Добавить
        </Button>
      </form>
      <ul className="mt-3 max-h-96 divide-y overflow-y-auto border-y">
        {items.map((it) => (
          <li key={it.slug} className="py-2.5 text-sm">
            {editing === it.slug ? (
              <div className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Новое название" />
                <Button size="sm" onClick={() => run(adminCatalogRename({ path: { kind, slug: it.slug }, body: { name } }), "Переименовано")}>
                  Сохранить
                </Button>
              </div>
            ) : merging === it.slug ? (
              <div className="flex flex-wrap items-center gap-2">
                <span>Слить «{it.name}» в</span>
                <select className={`${select} w-auto`} value={into} onChange={(e) => setInto(e.target.value)} aria-label="Куда слить">
                  <option value="">выбери</option>
                  {items
                    .filter((x) => x.slug !== it.slug)
                    .map((x) => (
                      <option key={x.slug} value={x.slug}>
                        {x.name}
                      </option>
                    ))}
                </select>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!into}
                  onClick={() => run(adminCatalogMerge({ path: { kind, slug: it.slug }, body: { into } }), "Дубль объединён")}
                >
                  Объединить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMerging(null)}>
                  Отмена
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="min-w-0 font-medium break-words">{it.name}</span>
                <span className="text-xs text-muted-foreground max-sm:hidden">{it.slug}</span>
                <button
                  type="button"
                  className="ml-auto text-xs font-semibold hover:underline"
                  onClick={() => {
                    setEditing(it.slug);
                    setName(it.name);
                  }}
                >
                  Переименовать
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-destructive hover:underline"
                  onClick={() => {
                    setMerging(it.slug);
                    setInto("");
                  }}
                >
                  Это дубль
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
