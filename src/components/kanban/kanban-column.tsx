"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { cn } from "@/lib/utils";
import type { KanbanCardData, StatusId } from "@/stores/kanban-store";

interface KanbanColumnProps {
  id: StatusId;
  title: string;
  color: string;
  cards: KanbanCardData[];
  isOver: boolean;
  activeCardId?: string | null;
  onSelectCard: (card: KanbanCardData) => void;
  onDeleteCard: (card: KanbanCardData) => void;
}

export const KanbanColumn = memo(({ id, title, color, cards, isOver, activeCardId, onSelectCard, onDeleteCard }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id, data: { type: "column", status: id } });
  const isDragging = Boolean(activeCardId);

  return (
    <section
      ref={setNodeRef}
      role="list"
      aria-label={`${title} column`}
      className={cn(
        "min-h-[420px] rounded-xl border border-border bg-muted/30 p-2 transition-colors duration-100 dark:bg-muted/10",
        isDragging && "border-border",
        isOver && "border-primary/35 bg-muted/50 dark:bg-muted/20"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
          <h3 className="truncate text-[13px] font-semibold text-foreground">{title}</h3>
        </div>
        <motion.span
          key={cards.length}
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          className="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs tabular-nums text-muted-foreground"
        >
          {cards.length}
        </motion.span>
      </div>

      <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-1">
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div key={card.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <KanbanCard
                  id={card.id}
                  company={card.company}
                  role={card.role}
                  date={card.date}
                  location={card.location}
                  fitScore={card.fitScore}
                  aiCompletedCount={card.aiCompletedCount}
                  status={id}
                  dragging={activeCardId === card.id}
                  onClick={() => onSelectCard(card)}
                  onEdit={() => onSelectCard(card)}
                  onDelete={() => onDeleteCard(card)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <div
            className={cn(
              "mt-1 rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground transition-all duration-100",
              "min-h-[110px] flex items-center justify-center",
              cards.length > 0 && "min-h-[72px] py-4",
              isOver && "border-primary/35 bg-muted/30 text-foreground"
            )}
          >
            {isOver ? "Drop here" : cards.length ? " " : "Drag here"}
          </div>
        </div>
      </SortableContext>
    </section>
  );
});
KanbanColumn.displayName = "KanbanColumn";
