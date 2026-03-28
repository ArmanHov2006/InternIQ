"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { memo, useRef } from "react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
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
  onEdit,
  onDelete,
  compact = false,
  className,
}: KanbanCardFaceProps) => {
  return (
    <article
      className={cn(
        "glass group rounded-xl border-l-2 border-l-primary p-3 transition-all",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{company}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
        {typeof fitScore === "number" ? (
          <span className="rounded-full bg-gradient-to-r from-primary/30 to-accent/30 px-2 py-0.5 text-xs">
            {fitScore}
          </span>
        ) : null}
      </div>
      {!compact ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {date} · {location}
        </p>
      ) : null}
      <div className="mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground"
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
        "cursor-grab select-none touch-none rounded-xl transition-transform duration-150 active:cursor-grabbing",
        !sortable.isDragging && !dragging && "hover:-translate-y-0.5 hover:shadow-glow-sm",
        sortable.isDragging && "opacity-30 blur-[1px]",
        dragging && "scale-[1.01]",
        className
      )}
    >
      <div className="relative">
        <button
          type="button"
          className={cn(
            "absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground",
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
