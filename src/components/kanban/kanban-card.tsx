"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { useRef } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTilt } from "@/hooks/use-tilt";
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
  compact?: boolean;
  className?: string;
}

export const KanbanCardFace = ({
  company,
  role,
  date,
  location,
  fitScore,
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
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </article>
  );
};

export const KanbanCard = ({
  id,
  company,
  role,
  status,
  date,
  location,
  fitScore,
  onClick,
  compact = false,
  dragging = false,
  className,
}: KanbanCardProps) => {
  const sortable = useSortable({ id, data: { type: "card", status } });
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(5);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const movedSincePointerDownRef = useRef(false);

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.isDragging ? undefined : sortable.transition,
  };

  return (
    <motion.article
      ref={sortable.setNodeRef}
      style={{
        ...style,
        rotateX: sortable.isDragging ? 0 : rotateX,
        rotateY: sortable.isDragging ? 0 : rotateY,
        transformPerspective: 800,
      }}
      {...sortable.attributes}
      {...sortable.listeners}
      onMouseMove={sortable.isDragging ? undefined : onMouseMove}
      onMouseLeave={sortable.isDragging ? undefined : onMouseLeave}
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
      className={cn("cursor-grab active:cursor-grabbing", sortable.isDragging && "opacity-30 blur-[1px]", className)}
      whileHover={sortable.isDragging ? undefined : { y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <KanbanCardFace company={company} role={role} date={date} location={location} fitScore={fitScore} compact={compact} />
    </motion.article>
  );
};
