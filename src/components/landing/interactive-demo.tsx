"use client";

import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { KanbanCard } from "@/components/kanban/kanban-card";

type ColumnId = "wishlist" | "applied" | "interview";

const initial = {
  wishlist: ["Notion SWE", "Datadog Intern"],
  applied: ["Stripe Product Analyst"],
  interview: ["Vercel Frontend Intern"],
};

export const InteractiveDemo = () => {
  const sensors = useSensors(useSensor(PointerSensor));
  const [columns, setColumns] = useState<Record<ColumnId, string[]>>(initial);

  const findColumn = (id: string) =>
    (Object.keys(columns) as ColumnId[]).find((col) => columns[col].includes(id));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const from = findColumn(String(active.id));
    const overId = String(over.id);
    const to = (Object.keys(columns) as ColumnId[]).includes(overId as ColumnId)
      ? (overId as ColumnId)
      : findColumn(overId);
    if (!from || !to || from === to) return;
    setColumns((prev) => ({
      ...prev,
      [from]: prev[from].filter((item) => item !== active.id),
      [to]: [String(active.id), ...prev[to]],
    }));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(columns) as ColumnId[]).map((columnId) => (
          <div
            key={columnId}
            id={columnId}
            className="rounded-lg border border-border bg-muted/30 p-3"
          >
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{columnId}</p>
            <SortableContext items={columns[columnId]} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {columns[columnId].map((card) => (
                  <KanbanCard
                    key={card}
                    id={card}
                    company={card.split(" ")[0]}
                    role={card.replace(card.split(" ")[0], "").trim()}
                    status="saved"
                    compact
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
};
