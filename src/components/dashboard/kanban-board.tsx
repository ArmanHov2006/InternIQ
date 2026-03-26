"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { CheckCircle2, Inbox, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  APPLICATION_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/constants";
import type { Application } from "@/types/database";
import { AddApplicationDialog } from "@/components/dashboard/add-application-dialog";
import { ApplicationDetailDialog } from "@/components/dashboard/application-detail-dialog";
import { KanbanColumn } from "@/components/dashboard/kanban-column";
import { KanbanSkeleton } from "@/components/dashboard/kanban-skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { fireConfetti } from "@/lib/confetti";
import { parseApiError } from "@/lib/utils";
import { friendlyTimeAgo, parseSuggestedStatusFromEvidence } from "@/lib/status-automation-ui";

type KanbanBoardProps = {
  openAddDialogToken: number;
};

const statusList = APPLICATION_STATUSES as readonly ApplicationStatus[];
type StatusEvent = {
  id: string;
  application_id: string;
  previous_status: string;
  next_status: string;
  source: string;
  confidence: number;
  evidence: string;
  created_at: string;
};

export function KanbanBoard({ openAddDialogToken }: KanbanBoardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragVisualReady, setDragVisualReady] = useState(false);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const horizontalScrollRef = useRef<HTMLDivElement | null>(null);
  const pointerXRef = useRef<number | null>(null);
  const dragIntentTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setAddDialogOpen(true);
  }, [openAddDialogToken]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      pointerXRef.current = null;
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      pointerXRef.current = event.clientX;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let rafId = 0;
    const EDGE_THRESHOLD = 120;
    const MAX_SCROLL_SPEED = 28;
    const MIN_SCROLL_SPEED = 2;

    const tick = () => {
      const container = horizontalScrollRef.current;
      const pointerX = pointerXRef.current;
      if (container && pointerX !== null) {
        const rect = container.getBoundingClientRect();
        const leftDist = pointerX - rect.left;
        const rightDist = rect.right - pointerX;
        let delta = 0;

        if (leftDist < EDGE_THRESHOLD) {
          const intensity = Math.max(0, (EDGE_THRESHOLD - leftDist) / EDGE_THRESHOLD);
          const eased = intensity * intensity;
          delta = -Math.ceil(MIN_SCROLL_SPEED + (MAX_SCROLL_SPEED - MIN_SCROLL_SPEED) * eased);
        } else if (rightDist < EDGE_THRESHOLD) {
          const intensity = Math.max(0, (EDGE_THRESHOLD - rightDist) / EDGE_THRESHOLD);
          const eased = intensity * intensity;
          delta = Math.ceil(MIN_SCROLL_SPEED + (MAX_SCROLL_SPEED - MIN_SCROLL_SPEED) * eased);
        }

        if (delta !== 0) {
          container.scrollLeft += delta;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [isDragging]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("select-none");
      if (dragIntentTimerRef.current) {
        window.clearTimeout(dragIntentTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [appRes, eventRes] = await Promise.all([
          fetch("/api/applications", {
            credentials: "same-origin",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/applications/status-events?limit=20", {
            credentials: "same-origin",
            headers: { Accept: "application/json" },
          }),
        ]);

        const appPayload = (await appRes.json()) as Application[] | { error?: string };
        if (!appRes.ok) {
          throw new Error(parseApiError(appPayload, "Failed to load applications."));
        }
        setApplications(appPayload as Application[]);

        const eventPayload = (await eventRes.json()) as StatusEvent[] | { error?: string };
        if (eventRes.ok) {
          setEvents(eventPayload as StatusEvent[]);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load applications.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const grouped = useMemo(() => {
    const initial = Object.fromEntries(
      statusList.map((status) => [status, [] as Application[]])
    ) as Record<ApplicationStatus, Application[]>;
    for (const app of applications) {
      initial[app.status].push(app);
    }
    return initial;
  }, [applications]);

  const isEmpty = useMemo(
    () => statusList.every((status) => grouped[status].length === 0),
    [grouped]
  );
  const suggestions = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.suggestion_pending || application.status_source === "email_suggested"
      ),
    [applications]
  );
  const latestAutoUpdate = useMemo(
    () =>
      applications
        .filter((application) => application.status_source === "email_auto" && application.auto_updated_at)
        .sort(
          (a, b) =>
            new Date(b.auto_updated_at ?? 0).getTime() -
            new Date(a.auto_updated_at ?? 0).getTime()
        )[0] ?? null,
    [applications]
  );

  const upsertApplication = (next: Application) => {
    setApplications((prev) => {
      const idx = prev.findIndex((item) => item.id === next.id);
      if (idx === -1) return [next, ...prev];
      const clone = [...prev];
      clone[idx] = next;
      return clone;
    });
  };

  const removeApplication = (id: string) => {
    setApplications((prev) => prev.filter((item) => item.id !== id));
    if (selected?.id === id) {
      setDetailOpen(false);
      setSelected(null);
    }
  };

  const openDetails = (application: Application) => {
    setSelected(application);
    setDetailOpen(true);
  };

  const refreshEvents = async () => {
    const eventRes = await fetch("/api/applications/status-events?limit=20", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!eventRes.ok) return;
    const eventPayload = (await eventRes.json()) as StatusEvent[];
    setEvents(eventPayload);
  };

  const applyStatusUpdate = async (application: Application, status: ApplicationStatus) => {
    const res = await fetch("/api/applications", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: application.id,
        status,
      }),
    });
    const payload = (await res.json()) as Application | { error?: string };
    if (!res.ok) {
      throw new Error(parseApiError(payload, "Could not move application."));
    }
    const updated = payload as Application;
    upsertApplication(updated);
    if (selected?.id === updated.id) setSelected(updated);
    await refreshEvents();
    return updated;
  };

  const handleKeyboardMove = async (
    application: Application,
    nextStatus: Application["status"]
  ) => {
    try {
      await applyStatusUpdate(application, nextStatus);
      toast.success(`Moved to ${STATUS_LABELS[nextStatus]}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not move application.");
    }
  };

  const undoAutoUpdate = async (applicationId: string) => {
    try {
      const res = await fetch("/api/applications/undo-status", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });
      const payload = (await res.json()) as Application | { error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Undo failed."));
      }
      upsertApplication(payload as Application);
      await refreshEvents();
      toast.success("Auto update reverted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Undo failed.");
    }
  };

  const applySuggestion = async (applicationId: string) => {
    try {
      const res = await fetch("/api/applications/apply-suggestion", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });
      const payload = (await res.json()) as Application | { error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Could not apply suggestion."));
      }
      upsertApplication(payload as Application);
      await refreshEvents();
      toast.success("Suggestion applied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply suggestion.");
    }
  };

  const buildReorderedState = (
    sourceStatus: ApplicationStatus,
    destinationStatus: ApplicationStatus,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const groupedClone = Object.fromEntries(
      statusList.map((status) => [status, [...grouped[status]]])
    ) as Record<ApplicationStatus, Application[]>;

    const sourceList = groupedClone[sourceStatus];
    const [moved] = sourceList.splice(sourceIndex, 1);
    if (!moved) {
      return null;
    }

    const destinationList = groupedClone[destinationStatus];
    const movedWithNextStatus: Application = {
      ...moved,
      status: destinationStatus,
    };
    destinationList.splice(destinationIndex, 0, movedWithNextStatus);

    const flattened = statusList.flatMap((status) =>
      groupedClone[status].map((app, index) => ({
        ...app,
        status,
        display_order: index,
      }))
    );

    return {
      flattened,
      bulkUpdates: statusList.flatMap((status) =>
        groupedClone[status].map((app, index) => ({
          id: app.id,
          status,
          display_order: index,
        }))
      ),
      moved: movedWithNextStatus,
    };
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as ApplicationStatus;
    const destinationStatus = destination.droppableId as ApplicationStatus;
    const reordered = buildReorderedState(
      sourceStatus,
      destinationStatus,
      source.index,
      destination.index
    );
    if (!reordered) return;

    const previous = applications;
    setApplications(reordered.flattened);

    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          updates: reordered.bulkUpdates,
        }),
      });
      const payload = (await res.json()) as Application[] | { error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Could not move application."));
      }
      const updatedById = new Map((payload as Application[]).map((app) => [app.id, app]));
      setApplications((prev) => prev.map((app) => updatedById.get(app.id) ?? app));
      if (selected?.id && updatedById.has(selected.id)) {
        setSelected(updatedById.get(selected.id) ?? null);
      }
      await refreshEvents();
    } catch (e) {
      setApplications(previous);
      toast.error(e instanceof Error ? e.message : "Could not move application.");
    }

    if (sourceStatus !== destinationStatus) {
      toast.success(`Moved to ${STATUS_LABELS[destinationStatus]}.`);
      if (destinationStatus === "offer" && reordered.moved) {
        fireConfetti();
        toast.success("Congratulations! You got an offer! 🎉");
      }
    }
  };

  if (loading) {
    return <KanbanSkeleton />;
  }

  return (
    <>
      {isEmpty ? (
        <div className="mb-4">
          <EmptyState
            icon={Inbox}
            title="No applications yet"
            description="Start tracking your internship applications. Add your first one to get organized."
            action={
              <Button onClick={() => setAddDialogOpen(true)}>
                Add Application
              </Button>
            }
          />
        </div>
      ) : null}

      {latestAutoUpdate ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              Updated from email {friendlyTimeAgo(latestAutoUpdate.auto_updated_at)}:{" "}
              <strong>
                {latestAutoUpdate.company} -&gt; {STATUS_LABELS[latestAutoUpdate.status]}
              </strong>
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => void undoAutoUpdate(latestAutoUpdate.id)}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Undo
          </Button>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Review suggestions</p>
            <Badge variant="outline">{suggestions.length}</Badge>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((application) => {
              const suggested = parseSuggestedStatusFromEvidence(application.status_evidence);
              return (
                <div
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/20 bg-background/70 px-2 py-1.5 text-xs"
                >
                  <span className="text-muted-foreground">
                    {application.company} - {application.role}{" "}
                    {suggested ? `-> ${suggested.label}` : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => void applySuggestion(application.id)}
                    >
                      Apply
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => void undoAutoUpdate(application.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {events.length > 0 ? (
        <div className="mb-3 rounded-lg border border-border/60 bg-card/50 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Recent status activity</p>
          <div className="space-y-1.5">
            {events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background/70 px-2 py-1 text-xs"
              >
                <span className="text-muted-foreground">
                  {event.source.replace("_", " ")}: {event.previous_status} -&gt; {event.next_status}
                </span>
                <span className="text-muted-foreground/80">{friendlyTimeAgo(event.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <DragDropContext
        onDragStart={() => {
          setIsDragging(true);
          setDragVisualReady(false);
          if (dragIntentTimerRef.current) {
            window.clearTimeout(dragIntentTimerRef.current);
          }
          dragIntentTimerRef.current = window.setTimeout(() => {
            setDragVisualReady(true);
          }, 90);
          document.body.classList.add("select-none");
        }}
        onDragEnd={(result) => {
          setIsDragging(false);
          setDragVisualReady(false);
          if (dragIntentTimerRef.current) {
            window.clearTimeout(dragIntentTimerRef.current);
            dragIntentTimerRef.current = null;
          }
          document.body.classList.remove("select-none");
          void onDragEnd(result);
        }}
      >
        <div
          ref={horizontalScrollRef}
          data-lenis-prevent
          className={`flex gap-4 pb-2 transition-[scroll-behavior] ${
            isDragging ? "overflow-x-auto overscroll-x-contain cursor-grabbing" : "overflow-x-auto"
          }`}
        >
          {statusList.map((status) => (
            <div
              key={status}
              id={`tracker-stage-${status}`}
              className="w-full min-w-[300px] max-w-[320px] flex-1"
            >
              <KanbanColumn
                droppableId={status}
                title={STATUS_LABELS[status]}
                colorClass={STATUS_COLORS[status]}
                applications={grouped[status]}
                onCardClick={openDetails}
                onKeyboardMove={handleKeyboardMove}
                onAddClick={status === "saved" ? () => setAddDialogOpen(true) : undefined}
                mobileCollapsible={isMobile}
                isDragging={isDragging}
                dragVisualReady={dragVisualReady}
              />
            </div>
          ))}
        </div>
      </DragDropContext>

      <AddApplicationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreated={(application) => {
          upsertApplication(application);
        }}
      />

      <ApplicationDetailDialog
        application={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={(application) => {
          upsertApplication(application);
          setSelected(application);
        }}
        onDeleted={removeApplication}
      />
    </>
  );
}
