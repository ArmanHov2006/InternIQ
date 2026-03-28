"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useKanbanStore, type KanbanCardData } from "@/stores/kanban-store";

interface KanbanCardModalProps {
  card: KanbanCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KanbanCardModal = ({ card, open, onOpenChange }: KanbanCardModalProps) => {
  const setCardNotes = useKanbanStore((state) => state.setCardNotes);
  const [notes, setNotes] = useState(card?.notes ?? "");

  useEffect(() => {
    setNotes(card?.notes ?? "");
  }, [card?.id, card?.notes]);

  useEffect(() => {
    if (!open || !card?.id) return;
    const timer = window.setTimeout(async () => {
      if ((card.notes ?? "") === notes) return;
      try {
        const response = await fetch("/api/applications", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ id: card.id, notes }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || "Could not save notes.");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save notes.");
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [card?.id, card?.notes, notes, open]);

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
            <p className="mt-3 text-xs uppercase text-muted-foreground">Status Provenance</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Source: {card?.lastStatusChangeSource ?? "manual"}
            </p>
            {card?.lastStatusChangeAt ? (
              <p className="text-xs text-muted-foreground">
                Updated: {new Date(card.lastStatusChangeAt).toLocaleString()}
              </p>
            ) : null}
            {card?.lastStatusChangeReason ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Reason: {card.lastStatusChangeReason}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Notes</p>
            <textarea
              className="mt-2 h-28 w-full rounded-xl border border-white/10 bg-white/[0.02] p-2 text-sm"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                if (card?.id) {
                  setCardNotes(card.id, event.target.value);
                }
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
