"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createReport, type ReportReason } from "@/lib/api";

const REASONS: Record<ReportReason, string> = {
  spam: "Спам или реклама",
  fake: "Фейк или обман",
  scam: "Мошенничество",
  offensive: "Оскорбления",
  other: "Другое",
};

export function ReportButton({ targetType, targetId }: { targetType: "profile" | "startup"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [comment, setComment] = useState("");

  async function submit() {
    const { error } = await createReport({ body: { target_type: targetType, target_id: targetId, reason, comment } });
    if (error) return toast.error("Не удалось отправить жалобу");
    toast.success("Жалоба отправлена модераторам");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-sm text-muted-foreground hover:text-destructive">Пожаловаться</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {Object.entries(REASONS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="reason" checked={reason === value} onChange={() => setReason(value as ReportReason)} className="accent-[var(--brand)]" />
              {label}
            </label>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Что не так? (необязательно)" />
        <DialogFooter>
          <Button variant="destructive" onClick={submit}>
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
