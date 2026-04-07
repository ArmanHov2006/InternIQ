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
import { CheckCircle2, MoveRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

interface CardInsight {
  summary: string;
  strengths: string[];
  nextAction: string;
  signal: string;
  source: string;
}

interface StageChipProps {
  columnId: ApplicationStatus;
  count: number;
  active: boolean;
  glow?: boolean;
  onClick: () => void;
}

const STATUS_HINTS: Record<ApplicationStatus, string> = {
  saved: "Worth a closer look",
  applied: "Sent and waiting",
  interview: "High-priority prep",
  offer: "Conversion moment",
  rejected: "Closed for now",
};

const STAGE_EMPTY_COPY: Record<ApplicationStatus, { title: string; body: string }> = {
  saved: {
    title: "Nothing saved yet",
    body: "Discovery can keep this lane full, then you can drag the strongest roles forward.",
  },
  applied: {
    title: "No live applications",
    body: "Move a saved opportunity here once the tailored materials are ready.",
  },
  interview: {
    title: "No interviews scheduled",
    body: "This is where fit analysis and follow-up preparation start compounding.",
  },
  offer: {
    title: "No offers yet",
    body: "Drag a promising card here to feel the payoff state and offer glow.",
  },
  rejected: {
    title: "Rejected stays quiet",
    body: "Keep closed loops visible without letting them dominate the workspace.",
  },
};

const stageGuidance: Record<ApplicationStatus, string> = {
  saved: "Scan promising opportunities, then inspect one before moving it forward.",
  applied: "Keep your active applications and their strongest signals in one focused lane.",
  interview: "Interview-stage roles surface the highest-leverage preparation first.",
  offer: "Offer stage is intentionally celebratory and highlights the finish line.",
  rejected: "Closed roles stay organized without taking over the workspace.",
};

const cardInsights: Record<string, CardInsight> = {
  "notion-swe-intern": {
    summary: "Strong product engineering fit with clean frontend signals and intern-friendly scope.",
    strengths: ["React projects", "Product taste", "Rapid shipping"],
    nextAction: "Tailor two bullets around collaboration and shipped product decisions.",
    signal: "Promising early match",
    source: "Saved from discovery",
  },
  "datadog-analytics-intern": {
    summary: "Solid analytics upside, but the story gets stronger once you show metrics ownership.",
    strengths: ["SQL fluency", "Dashboard thinking", "Ops exposure"],
    nextAction: "Add one quantified metrics project before sending the application.",
    signal: "Needs one stronger proof point",
    source: "Saved from discovery",
  },
  "stripe-product-analyst": {
    summary: "Good generalist match with strong product instincts and enough analytics coverage to apply now.",
    strengths: ["Product framing", "User empathy", "Cross-functional writing"],
    nextAction: "Keep the resume tailored and send a focused follow-up after five days.",
    signal: "Application ready",
    source: "Applied with AI assist",
  },
  "figma-design-eng": {
    summary: "Great creative-engineering overlap and a compelling product lens, especially for frontend craft work.",
    strengths: ["UI systems", "Frontend polish", "Design collaboration"],
    nextAction: "Open the drawer and generate a cold email while the role is still warm.",
    signal: "Good for outreach",
    source: "Applied with custom resume",
  },
  "vercel-frontend-intern": {
    summary: "High match. The role lines up with frontend depth, shipping speed, and the kind of product surface you already know.",
    strengths: ["Frontend depth", "Performance mindset", "Product iteration"],
    nextAction: "Use the AI prep notes to shape interview stories around shipping and ownership.",
    signal: "Interview momentum",
    source: "Moved from applied to interview",
  },
  "linear-swe-intern": {
    summary: "Best-fit role in the set with clear product-engineering overlap and a polished story already in place.",
    strengths: ["Execution quality", "Taste", "Clear ownership"],
    nextAction: "Package the best work sample and keep response timing tight.",
    signal: "Offer-ready narrative",
    source: "Advanced through the full pipeline",
  },
};

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

const StageChip = ({ columnId, count, active, glow = false, onClick }: StageChipProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: columnId });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border bg-card/80 p-3 text-left shadow-sm transition-all duration-200",
        active && "border-primary/25 bg-primary/5",
        isOver && "border-primary/30 bg-primary/10 shadow-glow-xs",
        glow && "animate-glow-pulse shadow-glow-xs"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
            STATUS_COLORS[columnId]
          )}
        >
          {STATUS_LABELS[columnId]}
        </span>
        <span className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {count}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{STATUS_HINTS[columnId]}</p>
    </button>
  );
};

const EmptyStagePanel = ({ status }: { status: ApplicationStatus }) => (
  <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center">
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        STATUS_COLORS[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
    <p className="mt-4 text-sm font-medium text-foreground">{STAGE_EMPTY_COPY[status].title}</p>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">{STAGE_EMPTY_COPY[status].body}</p>
  </div>
);

export const InteractiveDemo = () => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [columns, setColumns] = useState<Record<ApplicationStatus, DemoCard[]>>(buildInitialColumns);
  const [activeStatus, setActiveStatus] = useState<ApplicationStatus>("saved");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    buildInitialColumns().saved[0]?.id ?? null
  );
  const [offerGlow, setOfferGlow] = useState(false);
  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCards = columns[activeStatus];
  const selectedCard = activeCards.find((card) => card.id === selectedCardId) ?? activeCards[0] ?? null;
  const selectedInsight = selectedCard ? cardInsights[selectedCard.id] : null;

  useEffect(() => {
    return () => {
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedCardId && activeCards.some((card) => card.id === selectedCardId)) return;
    setSelectedCardId(activeCards[0]?.id ?? null);
  }, [activeCards, selectedCardId]);

  const visibleCards = useMemo(() => activeCards.slice(0, 3), [activeCards]);
  const hiddenCount = Math.max(activeCards.length - visibleCards.length, 0);

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
      setSelectedCardId(activeId);
      return;
    }

    setColumns((prev) => {
      const sourceCards = [...prev[fromColumn]];
      const destinationCards = [...prev[toColumn]];
      const sourceIndex = sourceCards.findIndex((card) => card.id === activeId);
      if (sourceIndex === -1) return prev;

      const [movedCard] = sourceCards.splice(sourceIndex, 1);
      const updatedCard: DemoCard = { ...movedCard, status: toColumn };
      destinationCards.push(updatedCard);

      return {
        ...prev,
        [fromColumn]: sourceCards,
        [toColumn]: destinationCards,
      };
    });

    setActiveStatus(toColumn);
    setSelectedCardId(activeId);

    if (toColumn === "offer") {
      triggerOfferGlow();
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-3">
        <div className="grid gap-2 md:grid-cols-5">
          {APPLICATION_STATUSES.map((columnId) => (
            <StageChip
              key={columnId}
              columnId={columnId}
              count={columns[columnId].length}
              active={activeStatus === columnId}
              glow={offerGlow && columnId === "offer"}
              onClick={() => setActiveStatus(columnId)}
            />
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.04fr)_minmax(280px,0.96fr)]">
          <div className="rounded-xl border border-border bg-card/75 p-3 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Focused queue</p>
                <h4 className="mt-1 text-lg font-semibold text-foreground">{STATUS_LABELS[activeStatus]}</h4>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Visible now</p>
                <p className="font-mono text-sm text-foreground">{columns[activeStatus].length}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">{stageGuidance[activeStatus]}</p>
              <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground">
                click to inspect
              </span>
            </div>

            <SortableContext items={visibleCards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
              <div className="mt-4 space-y-2.5">
                {visibleCards.length > 0 ? (
                  visibleCards.map((card) => (
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
                      landingCompact
                      active={selectedCard?.id === card.id}
                      onClick={() => setSelectedCardId(card.id)}
                    />
                  ))
                ) : (
                  <EmptyStagePanel status={activeStatus} />
                )}
              </div>
            </SortableContext>

            {hiddenCount > 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                +{hiddenCount} more roles tucked into this stage
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "rounded-xl border border-border bg-card/85 p-4 shadow-sm transition-all duration-200",
              offerGlow && selectedCard?.status === "offer" && "animate-glow-pulse shadow-glow-xs"
            )}
          >
            {selectedCard && selectedInsight ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
                          STATUS_COLORS[selectedCard.status]
                        )}
                      >
                        {STATUS_LABELS[selectedCard.status]}
                      </span>
                      <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                        {selectedInsight.source}
                      </span>
                    </div>
                    <h4 className="mt-3 text-lg font-semibold text-foreground">{selectedCard.role}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedCard.company} / {selectedCard.location}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-right">
                    <p className="text-[11px] text-muted-foreground">Fit score</p>
                    <p className="font-mono text-lg font-semibold text-foreground">
                      {typeof selectedCard.fitScore === "number" ? `${selectedCard.fitScore}%` : "--"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">AI actions</p>
                    <p className="mt-2 font-mono text-base font-semibold text-foreground">
                      {selectedCard.aiCompletedCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Updated</p>
                    <p className="mt-2 font-mono text-base font-semibold text-foreground">{selectedCard.date}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Signal</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{selectedInsight.signal}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                    <p className="text-sm font-medium text-foreground">AI snapshot</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedInsight.summary}</p>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Strongest signals</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedInsight.strengths.map((strength) => (
                      <span
                        key={strength}
                        className="rounded-full border border-border bg-muted/35 px-2.5 py-1 text-xs text-foreground"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <MoveRight className="h-4 w-4 text-primary" aria-hidden />
                    <p className="text-sm font-medium text-foreground">Next move</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedInsight.nextAction}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Click cards to inspect them, or drag one onto a stage chip to update its status.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center">
                <p className="text-sm font-medium text-foreground">{STAGE_EMPTY_COPY[activeStatus].title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{STAGE_EMPTY_COPY[activeStatus].body}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
};
