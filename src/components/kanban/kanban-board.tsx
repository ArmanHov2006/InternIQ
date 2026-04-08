"use client";

import {
  type CollisionDetection,
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanCardFace } from "@/components/kanban/kanban-card";
import { ApplicationDrawer } from "@/components/pipeline/application-drawer";
import { KanbanFilters } from "@/components/kanban/kanban-filters";
import { buildPipelinePath, getPipelineAppIdFromSearch } from "@/lib/navigation/dashboard-routes";
import { useKanbanStore, type KanbanCardData, type StatusId } from "@/stores/kanban-store";
import type { Application } from "@/types/database";

const orderedStatuses: StatusId[] = ["saved", "applied", "interview", "offer", "rejected"];

export const KanbanBoard = () => {
  const {
    columns,
    cards,
    moveCard,
    reorderCard,
    removeById,
    addOrUpdateFromApplication,
    restoreBoard,
    search,
    setSearch,
    filter,
    setFilter,
    applicationsById,
    setApplicationRecord,
    hydrateFromApplications,
  } = useKanbanStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<StatusId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragSize, setDragSize] = useState<{ width: number; height: number } | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const updateRequestControllersRef = useRef<Map<string, AbortController>>(new Map());
  const searchParams = useSearchParams();
  const router = useRouter();

  const replacePipelineAppQuery = (appId: string | null) => {
    router.replace(buildPipelinePath(new URLSearchParams(searchParams.toString()), appId), { scroll: false });
  };

  useEffect(() => {
    const appId = getPipelineAppIdFromSearch(new URLSearchParams(searchParams.toString()));
    if (appId) setSelectedId(appId);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId || applicationsById[selectedId]) return;
    void (async () => {
      try {
        const res = await fetch("/api/applications", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const applications = (await res.json()) as Application[];
        hydrateFromApplications(applications);
      } catch {
        /* ignore */
      }
    })();
  }, [selectedId, applicationsById, hydrateFromApplications]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const parseApiError = async (response: Response, fallback: string): Promise<string> => {
    try {
      const payload = (await response.json()) as { error?: string; detail?: string };
      return payload.error || payload.detail || fallback;
    } catch {
      return fallback;
    }
  };

  const buildRestorePayload = (application: Application, displayOrder: number) => ({
    company: application.company,
    role: application.role,
    job_url: application.job_url,
    job_description: application.job_description ?? "",
    status: application.status,
    source: application.source ?? "manual",
    board: application.board ?? "",
    external_job_id: application.external_job_id ?? "",
    location: application.location,
    salary_range: application.salary_range,
    notes: application.notes,
    contact_name: application.contact_name,
    contact_email: application.contact_email,
    fit_score: application.fit_score,
    match_score: application.match_score ?? null,
    fit_analysis: application.fit_analysis,
    generated_email: application.generated_email,
    next_action_at: application.next_action_at ?? null,
    last_contacted_at: application.last_contacted_at ?? null,
    resume_version_id: application.resume_version_id ?? null,
    display_order: Math.max(displayOrder, 0),
    applied_date: application.applied_date,
    last_status_change_source: application.last_status_change_source,
    last_status_change_reason: application.last_status_change_reason,
    last_status_change_at: application.last_status_change_at,
    ai_metadata:
      application.ai_metadata && typeof application.ai_metadata === "object"
        ? application.ai_metadata
        : {},
  });

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const cardCollision = pointerCollisions.find(
        (collision) => !orderedStatuses.includes(String(collision.id) as StatusId)
      );
      if (cardCollision) return [cardCollision];

      const columnCollision = pointerCollisions.find((collision) =>
        orderedStatuses.includes(String(collision.id) as StatusId)
      );
      if (columnCollision) return [columnCollision];

      return pointerCollisions;
    }
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
    setLiveMessage("Picked up card.");
    const initialRect = event.active.rect.current.initial;
    if (initialRect) {
      setDragSize({ width: initialRect.width, height: initialRect.height });
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
    setOverColumn(null);
    setDragSize(null);
    setLiveMessage("Drag cancelled.");
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
    const destinationIds = columns[to].cardIds.filter((id) => id !== cardId);
    const overIndex = destinationIds.indexOf(overId);
    const translated = active.rect.current.translated;
    const overRect = over.rect;
    const isOverColumn = orderedStatuses.includes(overId as StatusId);
    let newIndex = destinationIds.length;

    if (!isOverColumn && overIndex >= 0) {
      const isBelowOverItem =
        translated && overRect
          ? translated.top + translated.height / 2 > overRect.top + overRect.height / 2
          : false;
      newIndex = overIndex + (isBelowOverItem ? 1 : 0);
    }
    const currentIndex = columns[from].cardIds.indexOf(cardId);
    const previousColumns = JSON.parse(JSON.stringify(columns)) as typeof columns;
    const previousCards = { ...cards };

    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    const cardRect = cardElement?.getBoundingClientRect();

    const persistUpdate = async (
      payload: Record<string, unknown>,
      fallbackErrorMessage: string,
      requestCardId: string
    ) => {
      updateRequestControllersRef.current.get(requestCardId)?.abort();
      const controller = new AbortController();
      updateRequestControllersRef.current.set(requestCardId, controller);
      try {
        const res = await fetch("/api/applications", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await parseApiError(res, fallbackErrorMessage));
      } finally {
        if (updateRequestControllersRef.current.get(requestCardId) === controller) {
          updateRequestControllersRef.current.delete(requestCardId);
        }
      }
    };

    if (from === to) {
      if (newIndex === currentIndex || (newIndex === currentIndex + 1 && overId === cardId)) {
        return;
      }
      reorderCard(cardId, to, newIndex);
      try {
        await persistUpdate({ id: cardId, display_order: newIndex }, "Could not reorder card.", cardId);
        setLiveMessage(`Reordered card in ${columns[to].title}.`);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        restoreBoard(previousColumns, previousCards);
        toast.error(
          error instanceof Error ? `${error.message} Reverted.` : "Could not reorder application. Reverted."
        );
      }
      return;
    }

    moveCard(cardId, from, to, newIndex);
    try {
      await persistUpdate(
        { id: cardId, status: to, display_order: newIndex },
        "Could not update status.",
        cardId
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      restoreBoard(previousColumns, previousCards);
      toast.error(
        error instanceof Error ? `${error.message} Reverted.` : "Could not move application. Reverted."
      );
      return;
    }

    const confetti = (await import("canvas-confetti")).default;
    if (cardRect) {
      confetti({
        particleCount: 18,
        spread: 50,
        origin: { x: (cardRect.left + cardRect.width / 2) / window.innerWidth, y: cardRect.top / window.innerHeight },
        colors: [columns[to].color, getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()],
        startVelocity: 20,
        gravity: 0.8,
        ticks: 60,
      });
    }
    setLiveMessage(`Moved card from ${columns[from].title} to ${columns[to].title}.`);
    toast.success(`Moved to ${columns[to].title}`, {
      action: {
        label: "Undo",
        onClick: () => {
          restoreBoard(previousColumns, previousCards);
          void persistUpdate(
            { id: cardId, status: from, display_order: currentIndex },
            "Could not undo move.",
            cardId
          )
            .catch(() => {
              toast.error("Could not undo move.");
            });
          setLiveMessage(`Move undone. Back in ${columns[from].title}.`);
        },
      },
    });
  };

  const activeCard = activeId ? cards[activeId] : null;
  const handleDeleteCard = async (card: KanbanCardData) => {
    const from = findStatus(card.id);
    if (!from) return;
    const application = applicationsById[card.id] ?? null;
    const previousColumns = JSON.parse(JSON.stringify(columns)) as typeof columns;
    const previousCards = { ...cards };
    const previousIndex = columns[from].cardIds.indexOf(card.id);
    removeById(card.id);

    const restoreDeletedCard = async () => {
      if (!application) {
        restoreBoard(previousColumns, previousCards);
        toast.error("Undo is unavailable until the full application record finishes loading.");
        return;
      }
      try {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(buildRestorePayload(application, previousIndex)),
        });
        if (!response.ok) throw new Error(await parseApiError(response, "Could not undo delete."));
        const restored = (await response.json()) as Application;
        addOrUpdateFromApplication(restored);
      } catch {
        restoreBoard(previousColumns, previousCards);
        toast.error("Could not undo delete.");
      }
    };

    try {
      const response = await fetch("/api/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: card.id }),
      });
      if (!response.ok) throw new Error(await parseApiError(response, "Could not delete application."));
      setSelectedId((current) => {
        if (current === card.id) {
          replacePipelineAppQuery(null);
          return null;
        }
        return current;
      });
      if (application) {
        toast.success("Application deleted", {
          action: {
            label: "Undo",
            onClick: () => {
              void restoreDeletedCard();
            },
          },
        });
      } else {
        toast.success("Application deleted.");
      }
    } catch (error) {
      restoreBoard(previousColumns, previousCards);
      toast.error(error instanceof Error ? error.message : "Could not delete application.");
    }
  };

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
                  activeCardId={activeId}
                  onSelectCard={(card) => {
                    setSelectedId(card.id);
                    replacePipelineAppQuery(card.id);
                  }}
                  onDeleteCard={(card) => {
                    void handleDeleteCard(card);
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        <DragOverlay
          adjustScale={false}
          dropAnimation={{
            duration: 300,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: "0.35" } },
            }),
          }}
        >
          {activeCard ? (
            <motion.div
              style={{ width: dragSize?.width, height: dragSize?.height }}
              className="shadow-glow-md"
              initial={{ scale: 0.98, opacity: 0.9 }}
              animate={{ scale: 1.02, opacity: 1, rotate: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
            >
              <KanbanCardFace
                company={activeCard.company}
                role={activeCard.role}
                date={activeCard.date}
                location={activeCard.location}
                fitScore={activeCard.fitScore}
                className="border-border bg-card"
              />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <p aria-live="polite" className="sr-only">
        {liveMessage}
      </p>
      <ApplicationDrawer
        application={selectedId ? applicationsById[selectedId] ?? null : null}
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            replacePipelineAppQuery(null);
          }
        }}
        onUpdated={(app) => {
          addOrUpdateFromApplication(app);
          setApplicationRecord(app);
        }}
        onDeleted={(id) => {
          removeById(id);
          setSelectedId(null);
          replacePipelineAppQuery(null);
        }}
      />
    </>
  );
};
