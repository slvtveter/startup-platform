"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  adminBlockUser,
  adminDeleteStartup,
  adminDeleteUser,
  adminHideStartup,
  adminResolveReport,
  adminUnblockUser,
  adminUnhideStartup,
} from "@/lib/api";

export function AdminAction({ kind, id, label, variant = "outline" }: {
  kind: "block" | "unblock" | "hide" | "unhide" | "resolve" | "dismiss";
  id: string;
  label: string;
  variant?: "outline" | "destructive" | "ghost";
}) {
  const router = useRouter();
  async function run() {
    const res =
      kind === "block"
        ? await adminBlockUser({ path: { user_id: id } })
        : kind === "unblock"
          ? await adminUnblockUser({ path: { user_id: id } })
          : kind === "hide"
            ? await adminHideStartup({ path: { startup_id: id } })
            : kind === "unhide"
              ? await adminUnhideStartup({ path: { startup_id: id } })
              : await adminResolveReport({ path: { report_id: Number(id) }, query: { dismiss: kind === "dismiss" } });
    if (res.error) return toast.error("Не получилось");
    toast.success("Готово");
    router.refresh();
  }
  return (
    <Button size="sm" variant={variant} onClick={run}>
      {label}
    </Button>
  );
}

/** Удалить аккаунт или стартап насовсем — с подтверждением: вернуть нельзя. */
export function AdminDeleteUser({ id, name, kind = "user" }: { id: string; name: string; kind?: "user" | "startup" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    const res = kind === "user" ? await adminDeleteUser({ path: { user_id: id } }) : await adminDeleteStartup({ path: { startup_id: id } });
    setBusy(false);
    if (res.error) return toast.error("Не получилось удалить");
    setOpen(false);
    toast.success(kind === "user" ? "Аккаунт удалён" : "Стартап удалён");
    router.refresh();
  }
  return (
    <>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setOpen(true)}>
        Удалить
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить «{name}»?</DialogTitle>
            <DialogDescription>
              {kind === "user"
                ? "Профиль, стартапы, отклики и файлы удалятся насовсем. Вернуть нельзя."
                : "Стартап, места в команде и отклики удалятся насовсем. Переписка с людьми останется. Вернуть нельзя."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={run} disabled={busy}>
              Удалить насовсем
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
