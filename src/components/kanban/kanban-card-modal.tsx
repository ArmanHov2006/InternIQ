"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { KanbanCardData } from "@/stores/kanban-store";

interface KanbanCardModalProps {
  card: KanbanCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KanbanCardModal = ({ card, open, onOpenChange }: KanbanCardModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-2xl rounded-2xl border-white/10">
        <DialogHeader>
          <DialogTitle>{card?.company} — {card?.role}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Details</p>
            <p className="mt-2 text-sm text-muted-foreground">{card?.location} · {card?.date}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Notes</p>
            <textarea className="mt-2 h-28 w-full rounded-xl border border-white/10 bg-white/[0.02] p-2 text-sm" defaultValue={card?.notes ?? ""} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
