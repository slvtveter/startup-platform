"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  adminBlockUser,
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
