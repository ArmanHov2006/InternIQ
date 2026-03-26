"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { Share2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface BrowserFrameProps {
  url: string;
  children: React.ReactNode;
  className?: string;
}

interface MockCard {
  id: string;
  company: string;
  role: string;
}

type KanbanColumnKey = keyof typeof kanbanColumns;
type DemoPhase = {
  id: string;
  label: string;
  stage: KanbanColumnKey;
  durationMs: number;
  message: string;
  detail:
    | { type: "pipeline"; note: string }
    | { type: "fit"; score: number; note: string }
    | { type: "email"; lines: string[]; note: string }
    | { type: "summary"; note: string };
};

const kanbanColumns = {
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
} as const;

const movingCard: MockCard = { id: "stripe-moving", company: "Stripe", role: "Product Intern" };

const workflowTimeline: DemoPhase[] = [
  {
    id: "pipeline-applied",
    label: "Pipeline",
    stage: "applied",
    durationMs: 2800,
    message: "Opportunity captured and moved into Applied.",
    detail: {
      type: "pipeline",
      note: "Track where each application stands in one visual board.",
    },
  },
  {
    id: "pipeline-interview",
    label: "Pipeline",
    stage: "interview",
    durationMs: 2500,
    message: "Status updated to Interview with real-time stage movement.",
    detail: {
      type: "pipeline",
      note: "No manual spreadsheets. Stage transitions stay clean and fast.",
    },
  },
  {
    id: "pipeline-offer",
    label: "Pipeline",
    stage: "offer",
    durationMs: 2200,
    message: "Progress reaches Offer and updates the pipeline instantly.",
    detail: {
      type: "pipeline",
      note: "Win states become visible at a glance for momentum.",
    },
  },
  {
    id: "fit-suggestion",
    label: "AI Fit",
    stage: "offer",
    durationMs: 3200,
    message: "AI fit suggestion appears for decision confidence.",
    detail: {
      type: "fit",
      score: 92,
      note: "Based on skills, experience, and role requirements.",
    },
  },
  {
    id: "email-generation",
    label: "AI Email",
    stage: "offer",
    durationMs: 3300,
    message: "Cold email draft is generated with role-specific context.",
    detail: {
      type: "email",
      lines: [
        "Hi Sarah, I admire Stripe's product craft...",
        "I built a tracking platform used by 1,200+ students...",
        "Would love to connect about your internship team.",
      ],
      note: "Personalized outreach generated in seconds.",
    },
  },
  {
    id: "summary-reset",
    label: "Summary",
    stage: "offer",
    durationMs: 2600,
    message: "One flow: track pipeline, get AI guidance, send better outreach.",
    detail: {
      type: "summary",
      note: "InternIQ runs your internship process end-to-end.",
    },
  },
];

const heroCards: Record<keyof typeof kanbanColumns, MockCard[]> = {
  saved: [
    { id: "google-saved", company: "Google", role: "SWE Intern" },
    { id: "notion-saved", company: "Notion", role: "Design Intern" },
  ],
  applied: [
    { id: "vercel-applied", company: "Vercel", role: "Frontend Intern" },
    { id: "datadog-applied", company: "Datadog", role: "PM Intern" },
  ],
  interview: [{ id: "figma-interview", company: "Figma", role: "Platform Intern" }],
  offer: [{ id: "linear-offer", company: "Linear", role: "Product Intern" }],
};

const featureCards: Record<keyof typeof kanbanColumns, MockCard[]> = {
  saved: [{ id: "google-feature", company: "Google", role: "SWE Intern" }],
  applied: [],
  interview: [{ id: "figma-feature", company: "Figma", role: "Platform Intern" }],
  offer: [{ id: "linear-feature", company: "Linear", role: "Product Intern" }],
};

type KanbanVariant = "hero" | "feature";

export const BrowserFrame = ({ url, children, className }: BrowserFrameProps) => {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.65)] ${className ?? ""}`}
    >
      <div className="flex h-10 items-center gap-2 border-b border-border/70 bg-muted/45 px-4">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28CA41]" />
        <div className="ml-4 flex h-6 flex-1 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
          {url}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

export const KanbanMockup = ({ variant = "hero" }: { variant?: KanbanVariant }) => {
  const reducedMotion = useReducedMotion();
  const cards = variant === "hero" ? heroCards : featureCards;
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const phase = workflowTimeline[phaseIndex];
    const timer = window.setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % workflowTimeline.length);
    }, reducedMotion ? Math.min(phase.durationMs, 1500) : phase.durationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [phaseIndex, reducedMotion]);

  const activePhase = workflowTimeline[phaseIndex];
  const activeStage = activePhase.stage;

  const cardsByColumn = useMemo(() => {
    const map: Record<keyof typeof kanbanColumns, MockCard[]> = {
      saved: [...cards.saved],
      applied: [...cards.applied],
      interview: [...cards.interview],
      offer: [...cards.offer],
    };
    map[activeStage] = [movingCard, ...map[activeStage]];
    return map;
  }, [activeStage, cards]);

  return (
    <div className={`${variant === "hero" ? "max-w-4xl" : "max-w-md"}`}>
      <LayoutGroup>
        <div className="flex gap-3 overflow-x-auto">
          {(Object.keys(kanbanColumns) as Array<keyof typeof kanbanColumns>).map((key) => {
            const column = kanbanColumns[key];
            const entries = cardsByColumn[key];
            const isActiveDestination = key === activeStage && activeStage !== "applied";
            return (
              <div
                key={key}
                className={`h-full min-w-[120px] flex-1 rounded-xl p-3 ${column.tone} transition-all duration-300 ${
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
                    const isMoving = entry.id === movingCard.id;
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        layoutId={isMoving && !reducedMotion ? "moving-workflow-card" : undefined}
                        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={
                          isMoving && !reducedMotion
                            ? {
                                type: "spring",
                                stiffness: 260,
                                damping: 22,
                                mass: 0.6,
                              }
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
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium text-muted-foreground">{activePhase.message}</p>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            {activePhase.label}
          </span>
        </div>

        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
          {workflowTimeline.map((phase, idx) => (
            <div
              key={phase.id}
              className={`h-full flex-1 transition-colors duration-300 ${
                idx <= phaseIndex ? "bg-blue-400 dark:bg-blue-500" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-2.5">
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
};

export const ProfileMockup = () => {
  return (
    <div className="group max-w-md space-y-4 rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 transition-shadow duration-200 group-hover:shadow-[0_0_0_6px_rgba(59,130,246,0.12)]" />
          <div>
            <p className="text-sm font-bold text-foreground">Sarah Kim</p>
            <p className="text-xs text-muted-foreground">CS @ Stanford • Product-minded engineer</p>
          </div>
        </div>
        <Share2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex gap-2">
        {["React", "Python", "Figma"].map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-medium text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"
          >
            {skill}
          </span>
        ))}
      </div>
      <div className="grid gap-2">
        <div className="rounded-lg bg-muted/70 p-2 text-[10px] font-medium text-foreground/90">
          Smart Resume Parser
        </div>
        <div className="rounded-lg bg-muted/70 p-2 text-[10px] font-medium text-foreground/90">
          Internship Tracker Dashboard
        </div>
      </div>
    </div>
  );
};

export const AIToolsMockup = () => {
  return (
    <div className="grid max-w-md gap-3 rounded-xl border border-border/70 bg-card p-3 sm:grid-cols-2">
      <div className="rounded-lg bg-muted/70 p-2.5">
        <p className="text-[10px] font-semibold text-foreground/90">Cold Email</p>
        <div className="mt-2 space-y-1 text-[9px] text-muted-foreground">
          <p>To: recruiter@stripe.com</p>
          <p>Subject: Product Intern</p>
          <p className="pt-1 text-[8px] text-muted-foreground/80">Hi Sarah, I admire Stripe’s product craft...</p>
          <p className="text-[8px] text-muted-foreground/80">I built a dashboard used by 1,200 students...</p>
          <p className="text-[8px] text-muted-foreground/80">Would love to connect for your internship team.</p>
        </div>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[9px] font-medium text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
          <Sparkles className="h-3 w-3" />
          AI generated
        </div>
      </div>
      <div className="rounded-lg bg-muted/70 p-2.5">
        <p className="text-[10px] font-semibold text-foreground/90">Resume Analysis</p>
        <div className="mt-2 space-y-1">
          <div className="h-2 rounded bg-border" />
          <div className="h-2 w-4/5 rounded bg-yellow-200 dark:bg-yellow-500/40" />
          <div className="h-2 w-3/4 rounded bg-yellow-200 dark:bg-yellow-500/40" />
          <div className="h-2 w-5/6 rounded bg-yellow-200 dark:bg-yellow-500/40" />
        </div>
        <div className="mt-3">
          <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700 dark:bg-green-500/20 dark:text-green-300">
            Fit Score 92%
          </span>
        </div>
      </div>
    </div>
  );
};
