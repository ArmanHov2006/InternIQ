"use client";

import { useMemo, useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { ChevronDown, Inbox, Plus } from "lucide-react";
import type { Application } from "@/types/database";
import { STATUS_GRADIENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationCard } from "@/components/dashboard/application-card";

type KanbanColumnProps = {
  droppableId: Application["status"];
  title: string;
  colorClass: string;
  applications: Application[];
  onCardClick: (application: Application) => void;
  onKeyboardMove?: (application: Application, nextStatus: Application["status"]) => void;
  onAddClick?: () => void;
  mobileCollapsible: boolean;
  isDragging?: boolean;
  dragVisualReady?: boolean;
};

export function KanbanColumn({
  droppableId,
  title,
  colorClass,
  applications,
  onCardClick,
  onKeyboardMove,
  onAddClick,
  mobileCollapsible,
  isDragging = false,
  dragVisualReady = false,
}: KanbanColumnProps) {
  const [collapsed, setCollapsed] = useState(false);
  const gradientByStatus = `bg-gradient-to-r ${STATUS_GRADIENTS[droppableId]}`;

  const shouldHideCards = useMemo(
    () => mobileCollapsible && collapsed && !isDragging,
    [collapsed, isDragging, mobileCollapsible]
  );

  return (
    <div
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-xl border bg-muted/30 p-3 transition-all duration-200 md:min-w-[300px]",
        isDragging && "border-border/90 shadow-sm",
        dragVisualReady && "bg-muted/35"
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-xl", gradientByStatus)} />
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-2 text-left"
          onClick={() => {
            if (mobileCollapsible && !isDragging) setCollapsed((prev) => !prev);
          }}
        >
          <span className={cn("h-2.5 w-2.5 rounded-full border", colorClass)} />
          <p className="font-semibold">{title}</p>
          <Badge variant="secondary">{applications.length}</Badge>
          {mobileCollapsible ? (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                collapsed && "-rotate-90"
              )}
            />
          ) : null}
        </button>

        {onAddClick ? (
          <Button type="button" variant="ghost" size="icon" onClick={onAddClick} aria-label={`Add application to ${title}`}>
            <Plus className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[80px] rounded-lg border border-dashed border-transparent p-1 transition-all duration-200",
              snapshot.isDraggingOver &&
                "border-primary/50 bg-primary/8 ring-1 ring-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
            )}
          >
            {applications.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/30">
                <Inbox className="mb-2 h-8 w-8" />
                <p className="text-xs">No applications</p>
              </div>
            ) : (
              <div
                className={cn(
                  "space-y-2 transition-all duration-200",
                  shouldHideCards && "pointer-events-none max-h-0 overflow-hidden opacity-0"
                )}
              >
                {applications.map((application, index) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    index={index}
                    onClick={onCardClick}
                    onKeyboardMove={onKeyboardMove}
                    dragVisualReady={dragVisualReady}
                  />
                ))}
              </div>
            )}
            {shouldHideCards ? (
              <div
                className={cn(
                  "mt-1 flex min-h-[72px] items-center justify-center rounded-md border border-dashed border-muted-foreground/25 text-xs text-muted-foreground",
                  snapshot.isDraggingOver && "border-primary/50 bg-primary/10 text-primary"
                )}
              >
                Column collapsed. Tap header to expand.
              </div>
            ) : null}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
