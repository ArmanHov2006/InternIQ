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
  landingCompact?: boolean;
  active?: boolean;
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
  landingCompact?: boolean;
  active?: boolean;
  className?: string;
}

const buildMetaLabel = (date?: string, location?: string) =>
  [date, location].filter((value): value is string => Boolean(value?.trim())).join(" / ");

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
  landingCompact = false,
  active = false,
  className,
}: KanbanCardFaceProps) => {
  const metadataLabel = buildMetaLabel(date, location);
  const showActions = !landingCompact && !compact && (Boolean(onEdit) || Boolean(onDelete));
  const showMetadata = landingCompact || !compact;

  return (
    <article
      className={cn(
        "group flex flex-col border border-border bg-card transition-all duration-200",
        landingCompact
          ? "gap-2.5 rounded-lg p-3 shadow-sm hover:border-primary/25 hover:bg-card"
          : "gap-3 rounded-xl p-4 hover:border-primary/20",
        active && "border-primary/25 bg-primary/5 shadow-glow-xs",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("truncate font-semibold text-foreground", landingCompact ? "text-sm" : "text-[13px]")}>
            {company}
          </p>
          <p
            className={cn(
              "min-w-0 text-muted-foreground",
              landingCompact ? "line-clamp-1 text-[13px] font-medium" : "text-sm font-medium"
            )}
          >
            {role}
          </p>
        </div>

        {typeof fitScore === "number" ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/25 bg-primary/10 font-mono text-primary",
              landingCompact ? "px-2 py-1 text-[11px]" : "px-2 py-0.5 text-xs"
            )}
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            {fitScore}%
          </span>
        ) : null}
      </div>

      {showMetadata ? (
        <div
          className={cn(
            "flex items-center justify-between gap-2 text-muted-foreground",
            landingCompact ? "text-[11px]" : "text-[11px]"
          )}
        >
          <p className="min-w-0 truncate">{metadataLabel || "No metadata yet"}</p>

          {aiCompletedCount > 0 ? (
            <div
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/40",
                landingCompact ? "px-2 py-1" : "px-2 py-0.5"
              )}
              aria-label={`${aiCompletedCount} AI actions completed`}
            >
              <Sparkles className="h-3 w-3 text-primary" aria-hidden />
              <span className="font-mono text-[10px] text-foreground">{aiCompletedCount}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: Math.min(aiCompletedCount, 3) }).map((_, idx) => (
                  <span key={idx} className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showActions ? (
        <div className="mt-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
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
      ) : null}
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
  landingCompact = false,
  active = false,
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

  const showHandle = !landingCompact;

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
        "cursor-grab select-none touch-none transition-transform duration-150 active:cursor-grabbing",
        landingCompact ? "rounded-lg" : "rounded-xl",
        !sortable.isDragging && !dragging && !landingCompact && "hover:-translate-y-px",
        !sortable.isDragging && !dragging && landingCompact && "hover:-translate-y-0.5",
        sortable.isDragging && "opacity-30 blur-[1px]",
        dragging && "scale-[1.01]",
        className
      )}
    >
      <div className="relative">
        {showHandle ? (
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
        ) : null}

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
          landingCompact={landingCompact}
          active={active}
          className={showHandle ? "pr-10" : undefined}
        />
      </div>
    </article>
  );
});
KanbanCard.displayName = "KanbanCard";
