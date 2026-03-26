"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { cn } from "@/lib/utils";
import type { KanbanCardData, StatusId } from "@/stores/kanban-store";

interface KanbanColumnProps {
  id: StatusId;
  title: string;
  color: string;
  cards: KanbanCardData[];
  isOver: boolean;
  onSelectCard: (card: KanbanCardData) => void;
}

export const KanbanColumn = ({ id, title, color, cards, isOver, onSelectCard }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id, data: { type: "column", status: id } });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "glass rounded-2xl p-3 transition-all min-h-[420px]",
        isOver && "border-white/20 shadow-glow-md"
      )}
      style={{ boxShadow: isOver ? `0 0 30px color-mix(in oklab, ${color} 50%, transparent)` : undefined }}
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
                  onClick={() => onSelectCard(card)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {!cards.length ? (
            <div className="mt-3 rounded-xl border border-dashed border-white/20 py-10 text-center text-sm text-muted-foreground animate-pulse">
              Drag here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
};
