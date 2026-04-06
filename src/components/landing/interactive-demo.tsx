"use client";

import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";
import { KanbanCard } from "@/components/kanban/kanban-card";
import {
  APPLICATION_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface DemoCard {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  date: string;
  location: string;
  fitScore?: number;
  aiCompletedCount?: number;
}

interface DemoColumnProps {
  columnId: ApplicationStatus;
  cards: DemoCard[];
  glow?: boolean;
}

const demoCards: DemoCard[] = [
  {
    id: "notion-swe-intern",
    company: "Notion",
    role: "SWE Intern",
    status: "saved",
    date: "Apr 03",
    location: "San Francisco",
  },
  {
    id: "datadog-analytics-intern",
    company: "Datadog",
    role: "Analytics Intern",
    status: "saved",
    date: "Apr 02",
    location: "New York",
  },
  {
    id: "stripe-product-analyst",
    company: "Stripe",
    role: "Product Analyst",
    status: "applied",
    date: "Apr 01",
    location: "Remote",
    fitScore: 72,
    aiCompletedCount: 2,
  },
  {
    id: "figma-design-eng",
    company: "Figma",
    role: "Design Eng",
    status: "applied",
    date: "Mar 30",
    location: "New York",
  },
  {
    id: "vercel-frontend-intern",
    company: "Vercel",
    role: "Frontend Intern",
    status: "interview",
    date: "Mar 28",
    location: "Remote",
    fitScore: 87,
    aiCompletedCount: 3,
  },
  {
    id: "linear-swe-intern",
    company: "Linear",
    role: "SWE Intern",
    status: "offer",
    date: "Mar 25",
    location: "Remote",
    fitScore: 94,
  },
];

const buildInitialColumns = (): Record<ApplicationStatus, DemoCard[]> => ({
  saved: demoCards.filter((card) => card.status === "saved"),
  applied: demoCards.filter((card) => card.status === "applied"),
  interview: demoCards.filter((card) => card.status === "interview"),
  offer: demoCards.filter((card) => card.status === "offer"),
  rejected: [],
});

const isColumnId = (value: string): value is ApplicationStatus =>
  APPLICATION_STATUSES.includes(value as ApplicationStatus);

const findColumn = (
  columns: Record<ApplicationStatus, DemoCard[]>,
  cardId: string
): ApplicationStatus | undefined =>
  APPLICATION_STATUSES.find((columnId) => columns[columnId].some((card) => card.id === cardId));

const DemoColumn = ({ columnId, cards, glow = false }: DemoColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border border-border bg-muted/30 p-3 transition-all duration-150",
        isOver && "border-primary/20 bg-muted/50",
        glow && "animate-glow-pulse shadow-glow-xs"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
            STATUS_COLORS[columnId]
          )}
        >
          {STATUS_LABELS[columnId]}
        </span>
        <span className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {cards.length}
        </span>
      </div>

      <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              id={card.id}
              company={card.company}
              role={card.role}
              status={card.status}
              date={card.date}
              location={card.location}
              fitScore={card.fitScore}
              aiCompletedCount={card.aiCompletedCount}
            />
          ))}
          {cards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card/50 px-3 py-6 text-center text-sm text-muted-foreground">
              Drop a role here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
};

export const InteractiveDemo = () => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [columns, setColumns] = useState<Record<ApplicationStatus, DemoCard[]>>(buildInitialColumns);
  const [offerGlow, setOfferGlow] = useState(false);
  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    };
  }, []);

  const triggerOfferGlow = () => {
    setOfferGlow(true);
    if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    glowTimeoutRef.current = setTimeout(() => setOfferGlow(false), 2500);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const fromColumn = findColumn(columns, activeId);
    const toColumn = isColumnId(overId) ? overId : findColumn(columns, overId);

    if (!fromColumn || !toColumn) return;
    if (activeId === overId) return;

    if (fromColumn === toColumn) {
      if (isColumnId(overId)) return;

      const fromIndex = columns[fromColumn].findIndex((card) => card.id === activeId);
      const toIndex = columns[toColumn].findIndex((card) => card.id === overId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      setColumns((prev) => ({
        ...prev,
        [fromColumn]: arrayMove(prev[fromColumn], fromIndex, toIndex),
      }));

      if (toColumn === "offer") triggerOfferGlow();
      return;
    }

    setColumns((prev) => {
      const sourceCards = [...prev[fromColumn]];
      const destinationCards = [...prev[toColumn]];
      const sourceIndex = sourceCards.findIndex((card) => card.id === activeId);
      if (sourceIndex === -1) return prev;

      const [movedCard] = sourceCards.splice(sourceIndex, 1);
      const updatedCard: DemoCard = { ...movedCard, status: toColumn };
      const destinationIndex = isColumnId(overId)
        ? destinationCards.length
        : destinationCards.findIndex((card) => card.id === overId);

      if (destinationIndex === -1) {
        destinationCards.push(updatedCard);
      } else {
        destinationCards.splice(destinationIndex, 0, updatedCard);
      }

      return {
        ...prev,
        [fromColumn]: sourceCards,
        [toColumn]: destinationCards,
      };
    });

    if (toColumn === "offer") triggerOfferGlow();
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[1120px] grid-cols-5 gap-3">
          {APPLICATION_STATUSES.map((columnId) => (
            <DemoColumn key={columnId} columnId={columnId} cards={columns[columnId]} glow={offerGlow && columnId === "offer"} />
          ))}
        </div>
      </div>
    </DndContext>
  );
};
