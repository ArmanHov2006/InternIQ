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
        "glass min-h-[420px] rounded-2xl p-3 transition-all duration-200",
        isDragging && "border-white/10",
        isOver && "border-white/30 shadow-glow-md"
      )}
      style={{
        boxShadow: isOver
          ? `0 0 34px color-mix(in oklab, ${color} 55%, transparent)`
          : undefined,
        backgroundColor: isOver ? "color-mix(in oklab, white 4%, transparent)" : undefined,
        transition: "box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="mb-3">
        <div className="h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <div className="mt-2 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <motion.span key={cards.length} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
            {cards.length}
          </motion.span>
        </div>
      </div>

      <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
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
              "mt-3 rounded-xl border border-dashed border-white/20 py-10 text-center text-sm text-muted-foreground transition-all",
              "min-h-[110px] flex items-center justify-center",
              cards.length > 0 && "py-4 min-h-[72px]",
              isOver && "scale-[1.01] border-white/40 bg-white/[0.04] text-foreground"
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
