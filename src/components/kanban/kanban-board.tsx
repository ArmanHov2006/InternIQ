"use client";

import {
  type CollisionDetection,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanCardFace } from "@/components/kanban/kanban-card";
import { KanbanCardModal } from "@/components/kanban/kanban-card-modal";
import { KanbanFilters } from "@/components/kanban/kanban-filters";
import { useKanbanStore, type KanbanCardData, type StatusId } from "@/stores/kanban-store";

const orderedStatuses: StatusId[] = ["saved", "applied", "phone_screen", "interview", "offer", "rejected"];

export const KanbanBoard = () => {
  const { columns, cards, moveCard, reorderCard, search, setSearch, filter, setFilter } = useKanbanStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<StatusId | null>(null);
  const [selected, setSelected] = useState<KanbanCardData | null>(null);
  const [dragSize, setDragSize] = useState<{ width: number; height: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return closestCorners(args);
  };

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    return Object.fromEntries(
      Object.entries(cards).filter(([, card]) => {
        const matchesSearch =
          !query ||
          card.company.toLowerCase().includes(query) ||
          card.role.toLowerCase().includes(query);
        const matchesFilter = !filter || card.tags.includes(filter);
        return matchesSearch && matchesFilter;
      })
    ) as typeof cards;
  }, [cards, filter, search]);

  const findStatus = (cardId: string): StatusId | null => {
    for (const status of orderedStatuses) {
      if (columns[status].cardIds.includes(cardId)) return status;
    }
    return null;
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    const initialRect = event.active.rect.current.initial;
    if (initialRect) {
      setDragSize({ width: initialRect.width, height: initialRect.height });
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
    setOverColumn(null);
    setDragSize(null);
  };

  const onDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return setOverColumn(null);
    if (orderedStatuses.includes(overId as StatusId)) {
      setOverColumn(overId as StatusId);
      return;
    }
    const status = findStatus(overId);
    setOverColumn(status);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumn(null);
    setDragSize(null);
    if (!over) return;

    const cardId = String(active.id);
    if (cardId === String(over.id)) return;
    const from = findStatus(cardId);
    const overId = String(over.id);
    const to = orderedStatuses.includes(overId as StatusId) ? (overId as StatusId) : findStatus(overId);
    if (!from || !to) return;
    const destinationIds = columns[to].cardIds;
    const newIndex = orderedStatuses.includes(overId as StatusId)
      ? destinationIds.length
      : Math.max(destinationIds.indexOf(overId), 0);
    const currentIndex = columns[from].cardIds.indexOf(cardId);

    if (from === to) {
      if (newIndex === currentIndex || (newIndex === currentIndex + 1 && overId === cardId)) {
        return;
      }
      reorderCard(cardId, to, newIndex);
      return;
    }

    moveCard(cardId, from, to, newIndex);

    const confetti = (await import("canvas-confetti")).default;
    const element = document.querySelector(`[data-card-id="${cardId}"]`);
    const rect = element?.getBoundingClientRect();
    if (rect) {
      confetti({
        particleCount: 18,
        spread: 50,
        origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: rect.top / window.innerHeight },
        colors: [columns[to].color, "oklch(0.7 0.2 300)"],
        startVelocity: 20,
        gravity: 0.8,
        ticks: 60,
      });
    }
  };

  const activeCard = activeId ? cards[activeId] : null;

  return (
    <>
      <KanbanFilters search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} />
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-3">
          {orderedStatuses.map((status) => {
            const cardList = columns[status].cardIds.map((id) => filteredCards[id]).filter(Boolean);
            return (
              <motion.div key={status} layout className="min-w-[280px] flex-1">
                <KanbanColumn
                  id={status}
                  title={columns[status].title}
                  color={columns[status].color}
                  cards={cardList}
                  isOver={overColumn === status}
                  onSelectCard={setSelected}
                />
              </motion.div>
            );
          })}
        </div>

        <DragOverlay adjustScale={false}>
          {activeCard ? (
            <div style={{ width: dragSize?.width }} className="shadow-glow-md">
              <KanbanCardFace
                company={activeCard.company}
                role={activeCard.role}
                date={activeCard.date}
                location={activeCard.location}
                fitScore={activeCard.fitScore}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <KanbanCardModal card={selected} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
};
