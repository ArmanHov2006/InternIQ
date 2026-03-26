"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type StageKey = "saved" | "applied" | "interview" | "offer";

type MockCard = {
  id: string;
  company: string;
  role: string;
};

type PhaseDetail =
  | { type: "pipeline"; note: string }
  | { type: "fit"; score: number; note: string }
  | { type: "email"; lines: string[]; note: string }
  | { type: "summary"; note: string };

type DemoPhase = {
  id: string;
  label: string;
  stage: StageKey;
  durationMs: number;
  message: string;
  detail: PhaseDetail;
};

type DemoWorkflowPayload = {
  account: {
    displayName: string;
    university: string;
    targetRole: string;
  };
  cardsByStage: Record<StageKey, MockCard[]>;
  movingCard: MockCard;
  phases: DemoPhase[];
};

const fallbackPayload: DemoWorkflowPayload = {
  account: {
    displayName: "Taylor Morgan",
    university: "State University",
    targetRole: "Product Intern",
  },
  cardsByStage: {
    saved: [
      { id: "saved-ramp", company: "Ramp", role: "Operations Intern" },
      { id: "saved-atlassian", company: "Atlassian", role: "PM Intern" },
    ],
    applied: [{ id: "applied-vercel", company: "Vercel", role: "Frontend Intern" }],
    interview: [{ id: "interview-figma", company: "Figma", role: "Product Intern" }],
    offer: [{ id: "offer-linear", company: "Linear", role: "Strategy Intern" }],
  },
  movingCard: { id: "moving-stripe", company: "Stripe", role: "Product Intern" },
  phases: [
    {
      id: "phase-applied",
      label: "Pipeline",
      stage: "applied",
      durationMs: 2800,
      message: "New role captured and moved into Applied.",
      detail: { type: "pipeline", note: "Track every application in one board." },
    },
    {
      id: "phase-interview",
      label: "Pipeline",
      stage: "interview",
      durationMs: 2600,
      message: "Recruiter response received and moved to Interview.",
      detail: { type: "pipeline", note: "Stage movement stays visible in real time." },
    },
    {
      id: "phase-fit",
      label: "AI Fit",
      stage: "interview",
      durationMs: 3000,
      message: "AI fit analysis marks this as a high-priority role.",
      detail: { type: "fit", score: 91, note: "Based on skills, projects, and requirements." },
    },
    {
      id: "phase-offer",
      label: "Pipeline",
      stage: "offer",
      durationMs: 2300,
      message: "After interviews, the role reaches Offer.",
      detail: { type: "pipeline", note: "Offer outcomes update the board immediately." },
    },
    {
      id: "phase-email",
      label: "AI Email",
      stage: "offer",
      durationMs: 3600,
      message: "InternIQ drafts outreach for similar high-fit opportunities.",
      detail: {
        type: "email",
        lines: [
          "Hi Nina - I loved Stripe's product rigor in docs + onboarding.",
          "I built a portfolio platform used by 1,200+ students across 20 campuses.",
          "Would you be open to a short intro call about your intern team?",
        ],
        note: "Generated drafts are personalized from your profile + target role.",
      },
    },
    {
      id: "phase-summary",
      label: "Summary",
      stage: "offer",
      durationMs: 2500,
      message: "One loop: track pipeline, prioritize with fit, and ship outreach.",
      detail: { type: "summary", note: "This is the daily InternIQ workflow." },
    },
  ],
};

const columns: Record<StageKey, { label: string; tone: string; dot: string; border: string }> = {
  saved: {
    label: "Saved",
    tone: "bg-blue-50 dark:bg-blue-500/10",
    dot: "bg-blue-600 dark:bg-blue-400",
    border: "border-blue-500/90 dark:border-blue-400/80",
  },
  applied: {
    label: "Applied",
    tone: "bg-amber-50 dark:bg-amber-500/10",
    dot: "bg-amber-500 dark:bg-amber-400",
    border: "border-amber-500/90 dark:border-amber-400/80",
  },
  interview: {
    label: "Interview",
    tone: "bg-purple-50 dark:bg-purple-500/10",
    dot: "bg-purple-500 dark:bg-purple-400",
    border: "border-purple-500/90 dark:border-purple-400/80",
  },
  offer: {
    label: "Offer",
    tone: "bg-green-50 dark:bg-green-500/10",
    dot: "bg-green-500 dark:bg-green-400",
    border: "border-green-500/90 dark:border-green-400/80",
  },
};

export function AppWorkflowPlayback() {
  const reducedMotion = useReducedMotion();
  const [data, setData] = useState<DemoWorkflowPayload>(fallbackPayload);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/demo-workflow", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as DemoWorkflowPayload;
        if (active) {
          setData(payload);
          setPhaseIndex(0);
        }
      } catch {
        // Fallback data is already loaded for resilience.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const phase = data.phases[phaseIndex];
    const timer = window.setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % data.phases.length);
    }, reducedMotion ? Math.min(phase.durationMs, 1500) : phase.durationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [data.phases, phaseIndex, reducedMotion]);

  const activePhase = data.phases[phaseIndex];
  const cardsByColumn = useMemo(() => {
    const cloned: Record<StageKey, MockCard[]> = {
      saved: [...data.cardsByStage.saved],
      applied: [...data.cardsByStage.applied],
      interview: [...data.cardsByStage.interview],
      offer: [...data.cardsByStage.offer],
    };
    cloned[activePhase.stage] = [data.movingCard, ...cloned[activePhase.stage]];
    return cloned;
  }, [activePhase.stage, data.cardsByStage, data.movingCard]);

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-3 flex flex-col items-start justify-between gap-1 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 sm:flex-row sm:items-center sm:gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Live Demo Account</p>
        <p className="text-[10px] text-muted-foreground sm:text-right">
          {data.account.displayName} • {data.account.university} • {data.account.targetRole}
        </p>
      </div>

      <LayoutGroup>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
          {(Object.keys(columns) as StageKey[]).map((key) => {
            const column = columns[key];
            const entries = cardsByColumn[key];
            const isActiveDestination = key === activePhase.stage && activePhase.stage !== "saved";
            return (
              <div
                key={key}
                className={`h-full min-w-[132px] snap-start flex-1 rounded-xl p-3 ${column.tone} transition-all duration-300 ${
                  isActiveDestination ? "ring-2 ring-blue-200/80 ring-offset-1 ring-offset-card dark:ring-blue-400/60" : ""
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                  <span className="text-xs font-semibold text-muted-foreground">{column.label}</span>
                  <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                    {entries.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {entries.map((entry, idx) => {
                    const isMoving = entry.id === data.movingCard.id;
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        layoutId={isMoving && !reducedMotion ? "hero-workflow-moving-card" : undefined}
                        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={
                          isMoving && !reducedMotion
                            ? { type: "spring", stiffness: 260, damping: 22, mass: 0.6 }
                            : { duration: 0.2, ease: "easeOut", delay: idx * 0.03 }
                        }
                        className={`rounded-lg border border-border/70 border-l-2 bg-card p-2.5 shadow-sm ${column.border} ${
                          isMoving
                            ? "ring-2 ring-blue-300/70 shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_12px_24px_rgba(59,130,246,0.18)] dark:ring-blue-400/70 dark:shadow-[0_0_0_1px_rgba(96,165,250,0.24),0_12px_24px_rgba(96,165,250,0.2)]"
                            : ""
                        } transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                      >
                        <p className="text-[10px] font-medium text-foreground">{entry.company}</p>
                        <p className="text-[9px] text-muted-foreground">{entry.role}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-3 space-y-2 px-1">
        <div className="flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-center sm:gap-2">
          <p className="text-[10px] font-medium text-foreground/80">{activePhase.message}</p>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            {activePhase.label}
          </span>
        </div>

        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
          {data.phases.map((phase, idx) => (
            <div
              key={phase.id}
              className={`h-full flex-1 transition-colors duration-300 ${idx <= phaseIndex ? "bg-blue-400 dark:bg-blue-500" : "bg-transparent"}`}
            />
          ))}
        </div>

        <div className="min-h-[72px] rounded-lg border border-border/70 bg-card/90 p-2.5 sm:min-h-[68px]">
          {activePhase.detail.type === "pipeline" ? (
            <p className="text-[10px] text-muted-foreground">{activePhase.detail.note}</p>
          ) : null}

          {activePhase.detail.type === "fit" ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground">{activePhase.detail.note}</p>
              <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700 dark:bg-green-500/20 dark:text-green-300">
                Fit {activePhase.detail.score}%
              </span>
            </div>
          ) : null}

          {activePhase.detail.type === "email" ? (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">{activePhase.detail.note}</p>
              <div className="rounded-md bg-muted/70 p-2 text-[9px] text-muted-foreground">
                {activePhase.detail.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          ) : null}

          {activePhase.detail.type === "summary" ? (
            <p className="text-[10px] font-medium text-foreground/90">{activePhase.detail.note}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
