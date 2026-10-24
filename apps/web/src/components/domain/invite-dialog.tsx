"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { invitePerson } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export type InviteOption = { roleId: string; label: string };

export function InviteDialog({ slug, name, options }: { slug: string; name: string; options: InviteOption[] }) {
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState(options[0]?.roleId ?? "");
  const [message, setMessage] = useState("");

  async function submit() {
    const { error } = await invitePerson({ path: { slug }, body: { startup_role_id: roleId, message } });
    if (error) return toast.error(errorMessage(error));
    toast.success(`Приглашение отправлено. ${name} получит письмо.`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="brand" size="lg" className="w-full" />}>Пригласить в команду</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пригласить: {name}</DialogTitle>
          <DialogDescription>Если приглашение примут, вы оба увидите контакты друг друга.</DialogDescription>
        </DialogHeader>
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="h-11 rounded-lg border bg-card px-3 text-sm">
          {options.map((o) => (
            <option key={o.roleId} value={o.roleId}>
              {o.label}
            </option>
          ))}
        </select>
        <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Почему зовёте именно этого человека и что предстоит делать" />
        <DialogFooter>
          <Button variant="brand" onClick={submit} disabled={message.trim().length < 10}>
            Отправить приглашение
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
