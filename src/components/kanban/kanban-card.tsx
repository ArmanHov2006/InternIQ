"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { memo, useRef } from "react";
import { GripVertical, Pencil, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusId } from "@/stores/kanban-store";

interface KanbanCardProps {
  id: string;
  company: string;
  role: string;
  status: StatusId;
  date?: string;
  location?: string;
  fitScore?: number;
  aiCompletedCount?: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  dragging?: boolean;
  className?: string;
}

interface KanbanCardFaceProps {
  company: string;
  role: string;
  date?: string;
  location?: string;
  fitScore?: number;
  aiCompletedCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  className?: string;
}

export const KanbanCardFace = memo(({
  company,
  role,
  date,
  location,
  fitScore,
  aiCompletedCount = 0,
  onEdit,
  onDelete,
  compact = false,
  className,
}: KanbanCardFaceProps) => {
  return (
    <article
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-100 hover:border-primary/20",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">{company}</p>
          <p className="text-sm font-medium text-muted-foreground">{role}</p>
        </div>
        {typeof fitScore === "number" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" aria-hidden />
            {fitScore}%
          </span>
        ) : null}
      </div>
      {!compact ? (
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <p>{date} · {location}</p>
          {aiCompletedCount > 0 ? (
            <div className="flex items-center gap-1" aria-label={`${aiCompletedCount} AI actions completed`}>
              {Array.from({ length: Math.min(aiCompletedCount, 5) }).map((_, idx) => (
                <span key={idx} className="h-1.5 w-1.5 rounded-full bg-primary/70" />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onEdit?.();
          }}
          aria-label={`Edit ${company}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/20 hover:text-red-300"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete?.();
          }}
          aria-label={`Delete ${company}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
});
KanbanCardFace.displayName = "KanbanCardFace";

export const KanbanCard = memo(({
  id,
  company,
  role,
  status,
  date,
  location,
  fitScore,
  aiCompletedCount,
  onClick,
  onEdit,
  onDelete,
  compact = false,
  dragging = false,
  className,
}: KanbanCardProps) => {
  const sortable = useSortable({ id, data: { type: "card", status } });
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const movedSincePointerDownRef = useRef(false);

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.isDragging ? undefined : sortable.transition,
  };

  return (
    <article
      ref={sortable.setNodeRef}
      style={style}
      {...sortable.attributes}
      {...sortable.listeners}
      aria-label={`${company} - ${role}. Draggable.`}
      aria-roledescription="sortable"
      onPointerDown={(event) => {
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
        movedSincePointerDownRef.current = false;
      }}
      onPointerMove={(event) => {
        if (!pointerStartRef.current) return;
        const dx = Math.abs(event.clientX - pointerStartRef.current.x);
        const dy = Math.abs(event.clientY - pointerStartRef.current.y);
        if (dx > 6 || dy > 6) movedSincePointerDownRef.current = true;
      }}
      onClick={(event) => {
        if (dragging || movedSincePointerDownRef.current) {
          event.preventDefault();
          event.stopPropagation();
          movedSincePointerDownRef.current = false;
          return;
        }
        onClick?.();
      }}
      data-cursor="drag"
      data-card-id={id}
      className={cn(
        "cursor-grab select-none touch-none rounded-xl transition-transform duration-100 active:cursor-grabbing",
        !sortable.isDragging && !dragging && "hover:-translate-y-px",
        sortable.isDragging && "opacity-30 blur-[1px]",
        dragging && "scale-[1.01]",
        className
      )}
    >
      <div className="relative">
        <button
          type="button"
          className={cn(
            "absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-input text-muted-foreground hover:text-foreground",
            "pointer-events-none opacity-70 md:hidden"
          )}
          aria-label="Drag application card"
          data-cursor="drag"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <KanbanCardFace
          company={company}
          role={role}
          date={date}
          location={location}
          fitScore={fitScore}
          aiCompletedCount={aiCompletedCount}
          onEdit={onEdit}
          onDelete={onDelete}
          compact={compact}
          className="pr-10"
        />
      </div>
    </article>
  );
});
KanbanCard.displayName = "KanbanCard";
