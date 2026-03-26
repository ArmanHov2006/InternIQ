"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import type { Application } from "@/types/database";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getSourceBadge } from "@/lib/status-automation-ui";

type ApplicationCardProps = {
  application: Application;
  index: number;
  onClick: (application: Application) => void;
  onKeyboardMove?: (application: Application, nextStatus: Application["status"]) => void;
  dragVisualReady?: boolean;
};

const getScoreColorClass = (score: number): string => {
  if (score >= 70) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
};

const getLeftBorderClass = (status: Application["status"]): string => {
  switch (status) {
    case "saved":
      return "border-l-blue-300";
    case "applied":
      return "border-l-indigo-300";
    case "recruiter_screen":
      return "border-l-cyan-300";
    case "hiring_manager":
      return "border-l-violet-300";
    case "final_round":
      return "border-l-fuchsia-300";
    case "take_home":
      return "border-l-amber-300";
    case "offer":
      return "border-l-green-300";
    case "rejected":
      return "border-l-red-300";
    case "withdrawn":
      return "border-l-slate-300";
    default:
      return "border-l-border";
  }
};

export function ApplicationCard({
  application,
  index,
  onClick,
  onKeyboardMove,
  dragVisualReady = false,
}: ApplicationCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const sourceBadge = getSourceBadge(application);

  return (
    <Draggable draggableId={application.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          tabIndex={0}
          id={`application-card-${application.id}`}
          onKeyDown={(event) => {
            if (!onKeyboardMove || !event.altKey || !event.shiftKey) return;
            const currentIndex = APPLICATION_STATUSES.indexOf(application.status);
            if (currentIndex === -1) return;
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
              const next = APPLICATION_STATUSES[currentIndex + 1];
              if (next) {
                event.preventDefault();
                onKeyboardMove(application, next);
                window.setTimeout(() => {
                  const el = document.getElementById(`application-card-${application.id}`);
                  if (el instanceof HTMLElement) el.focus();
                }, 80);
              }
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
              const prev = APPLICATION_STATUSES[currentIndex - 1];
              if (prev) {
                event.preventDefault();
                onKeyboardMove(application, prev);
                window.setTimeout(() => {
                  const el = document.getElementById(`application-card-${application.id}`);
                  if (el instanceof HTMLElement) el.focus();
                }, 80);
              }
            }
          }}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          }}
          className={cn(
            "kanban-card group relative w-full cursor-grab overflow-hidden rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition-all duration-200 ease-out active:cursor-grabbing hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5",
            getLeftBorderClass(application.status),
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            snapshot.isDragging &&
              dragVisualReady &&
              "scale-[1.018] shadow-xl ring-2 ring-primary/25"
          )}
          style={{
            ...provided.draggableProps.style,
            willChange: snapshot.isDragging ? "transform" : undefined,
            touchAction: "pan-y",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
            style={{
              background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.04), transparent 40%)`,
            }}
          />
          <div className="mb-2 flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onClick(application)}
              className="flex-1 text-left"
            >
              <p className="line-clamp-1 font-semibold">{application.company}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{application.role}</p>
            </button>
            <button
              type="button"
              {...provided.dragHandleProps}
              aria-label="Drag application"
              className="touch-none rounded-md border border-transparent p-2 text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-1.5"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-1 flex items-center gap-1.5 text-[10px]">
            <Badge variant="outline" className={cn("px-1.5 py-0 font-medium", sourceBadge.className)}>
              {sourceBadge.label}
            </Badge>
            <span className="text-muted-foreground">Alt+Shift+Arrows to move</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{application.applied_date || "Not applied yet"}</span>
            {application.fit_score !== null ? (
              <Badge
                variant="outline"
                className={cn("border text-[10px]", getScoreColorClass(application.fit_score))}
              >
                Fit {application.fit_score}
              </Badge>
            ) : null}
          </div>
        </div>
      )}
    </Draggable>
  );
}
