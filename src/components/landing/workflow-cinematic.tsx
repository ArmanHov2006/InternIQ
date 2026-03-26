"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BadgeCheck, Bot, BriefcaseBusiness, Mail, Sparkles, TrendingUp, Trophy } from "lucide-react";

type Phase = "capture" | "score" | "email" | "offer";

const timeline: Phase[] = ["capture", "score", "email", "offer"];

const phaseSnapshots = [
  {
    statLine: { total: 4, interviews: 1, offers: 0, responseRate: 50 },
    company: "Stripe",
    role: "Software Engineering Intern",
    location: "San Francisco, CA",
    updatedAt: "Updated 2m ago",
    score: 84,
    scoreNotes: ["Strong backend fundamentals", "Fast API learning curve", "Needs stronger system design examples"],
    emailSubject: "Intro from a CS student interested in Stripe's Infrastructure team",
    emailPreview:
      "Hi Maya — I loved your blog on reliability at scale. I recently built a distributed queue project and would value a quick chat.",
    caption: "New role captured and auto-tagged by internship track + location.",
  },
  {
    statLine: { total: 7, interviews: 2, offers: 0, responseRate: 57 },
    company: "Vercel",
    role: "Frontend Platform Intern",
    location: "Remote (US)",
    updatedAt: "Scored 30s ago",
    score: 88,
    scoreNotes: ["Excellent React/Next fit", "Strong UI systems experience", "Improve edge-runtime project depth"],
    emailSubject: "Following up: frontend platform internship alignment",
    emailPreview:
      "Hi Diego — your DX talks inspired my latest project. I mapped my profile to the role and scored high on frontend platform fit.",
    caption: "AI fit scoring surfaces strengths, gaps, and next actions in seconds.",
  },
  {
    statLine: { total: 11, interviews: 3, offers: 0, responseRate: 64 },
    company: "Linear",
    role: "Product Engineering Intern",
    location: "New York, NY",
    updatedAt: "Drafted 15s ago",
    score: 91,
    scoreNotes: ["High product sense signal", "Strong TypeScript + UX range", "Add impact metrics for recent projects"],
    emailSubject: "Quick intro — product-focused engineering internship fit",
    emailPreview:
      "Hi Lila — I'm applying for Product Engineering Intern. I attached a concise profile with shipped projects and measurable outcomes.",
    caption: "Outreach draft generated with role context and your real profile voice.",
  },
  {
    statLine: { total: 13, interviews: 4, offers: 1, responseRate: 69 },
    company: "Figma",
    role: "Design Engineering Intern",
    location: "Seattle, WA",
    updatedAt: "Offer stage now",
    score: 94,
    scoreNotes: ["Outstanding design-engineering blend", "Clear shipped portfolio evidence", "Keep interview notes tightly structured"],
    emailSubject: "Thank you — interview follow-up and timeline confirmation",
    emailPreview:
      "Hi Sarah — thank you for the process. I appreciated the panel discussion and shared a short recap with relevant project links.",
    caption: "Pipeline momentum compounds: role advances to offer with full context intact.",
  },
] as const;

const phaseLabels: Record<Phase, string> = {
  capture: "Captured",
  score: "Scored",
  email: "Drafted",
  offer: "Offer",
};

const statusColumns: Array<{ phase: Phase; label: string; cls: string }> = [
  { phase: "capture", label: "Saved", cls: "border-blue-500/25 bg-blue-500/10" },
  { phase: "score", label: "Applied", cls: "border-indigo-500/25 bg-indigo-500/10" },
  { phase: "email", label: "Interview", cls: "border-purple-500/25 bg-purple-500/10" },
  { phase: "offer", label: "Offer", cls: "border-emerald-500/25 bg-emerald-500/10" },
];

export function WorkflowCinematic() {
  const shouldReduceMotion = useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [offerPulse, setOfferPulse] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = window.setInterval(() => {
      setPhaseIndex((prev) => {
        const next = (prev + 1) % timeline.length;
        if (timeline[next] === "offer") setOfferPulse((n) => n + 1);
        return next;
      });
    }, 2100);
    return () => window.clearInterval(timer);
  }, [shouldReduceMotion]);

  const phase = timeline[phaseIndex];
  const activeIdx = Math.min(phaseIndex, timeline.length - 1);
  const data = useMemo(() => phaseSnapshots[phaseIndex % phaseSnapshots.length], [phaseIndex]);
  const progressPct = ((activeIdx + 1) / timeline.length) * 100;
  const statusRows = [
    { label: "Saved", count: 2 + activeIdx, color: "from-blue-400 to-blue-500" },
    { label: "Applied", count: 1 + activeIdx, color: "from-indigo-400 to-indigo-500" },
    { label: "Interview", count: activeIdx >= 2 ? activeIdx : 0, color: "from-purple-400 to-purple-500" },
    { label: "Offer", count: phase === "offer" ? 1 : 0, color: "from-emerald-400 to-emerald-500" },
  ];
  const statusTotal = Math.max(
    1,
    statusRows.reduce((sum, row) => sum + row.count, 0)
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-[#090c14]/92 p-4 shadow-2xl shadow-black/35 sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.16),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.14),transparent_56%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,6,14,0.72),rgba(6,10,19,0.68))]" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-500">
            <Sparkles className="h-3.5 w-3.5" />
            Real Workflow Playback
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
            Live loop
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-background/40 p-3">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Total Applications", value: data.statLine.total },
              { label: "Interviews", value: data.statLine.interviews },
              { label: "Offers", value: data.statLine.offers },
              { label: "Response Rate", value: `${data.statLine.responseRate}%` },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                className={`rounded-lg border p-2 ${
                  idx === activeIdx % 4
                    ? "border-blue-500/35 bg-blue-500/10"
                    : "border-border/60 bg-card/80"
                }`}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : { scale: idx === activeIdx % 4 ? 1.02 : 1, opacity: idx === activeIdx % 4 ? 1 : 0.88 }
                }
                transition={{ duration: 0.25 }}
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Status Distribution</p>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/55">
              {statusRows.map((row) => (
                <motion.div
                  key={row.label}
                  className={`h-full bg-gradient-to-r ${row.color}`}
                  animate={{ width: `${(row.count / statusTotal) * 100}%` }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4 }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {statusRows.map((row) => (
                <span key={row.label} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${row.color}`} />
                  {row.label}: {row.count}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-full border border-border/60 bg-background/60 p-1">
          <motion.div
            className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            className="text-xs text-muted-foreground"
          >
            {data.caption}
          </motion.p>
        </AnimatePresence>

        <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-border/50 bg-background/50 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">Pipeline</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {statusColumns.map((column, idx) => (
                <div key={column.label} className={`rounded-lg border p-2 ${column.cls}`}>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
                    {column.label}
                  </div>
                  <div className="space-y-1">
                    {idx <= activeIdx ? (
                      <motion.div
                        layout
                        className="rounded-md border border-border/60 bg-card px-2 py-1.5"
                        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="truncate text-xs font-semibold">{data.company}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{data.role}</p>
                        <p className="truncate text-[10px] text-muted-foreground/80">{data.updatedAt}</p>
                      </motion.div>
                    ) : (
                      <div className="rounded-md border border-dashed border-border/60 px-2 py-2">
                        <p className="truncate text-[10px] text-muted-foreground/70">Waiting stage update</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border/50 bg-background/50 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                AI Fit Score
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-emerald-500/70 text-lg font-bold text-emerald-500">
                  {data.score}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">High Match</p>
                  <p className="text-[11px] text-muted-foreground">{data.location}</p>
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {data.scoreNotes.map((note) => (
                  <li key={note} className="text-[11px] text-muted-foreground">
                    • {note}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">Outreach Draft</p>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <p className="truncate text-foreground/90">Subject: {data.emailSubject}</p>
                <p className="line-clamp-2">{data.emailPreview}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/35 px-2 py-0.5 text-[10px] text-muted-foreground">
                  Personalized
                </span>
                <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/35 px-2 py-0.5 text-[10px] text-muted-foreground">
                  ATS-safe
                </span>
                <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/35 px-2 py-0.5 text-[10px] text-muted-foreground">
                  72% reply probability
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "capture", icon: BriefcaseBusiness, label: phaseLabels.capture },
              { key: "score", icon: Bot, label: phaseLabels.score },
              { key: "email", icon: Mail, label: phaseLabels.email },
              { key: "offer", icon: Trophy, label: phaseLabels.offer },
            ].map((step, idx) => {
              const active = idx <= activeIdx;
              return (
                <div
                  key={step.key}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                    active
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-500"
                      : "border-border/60 bg-muted/35 text-muted-foreground"
                  }`}
                >
                  <step.icon className="h-3.5 w-3.5" />
                  {step.label}
                </div>
              );
            })}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${phase}-${offerPulse}`}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                className="ml-auto"
              >
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {phase === "offer" ? "Offer unlocked" : "Workflow active"}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-background/50 px-3 py-2">
          <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Recruiter visibility feed
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full border border-border/60 bg-muted/35 px-2 py-1">{data.company} role viewed</span>
            <span className="rounded-full border border-border/60 bg-muted/35 px-2 py-1">Outreach personalized</span>
            <span className="rounded-full border border-border/60 bg-muted/35 px-2 py-1">Next best step: {phaseLabels[phase].toLowerCase()}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/35 px-2 py-1">
              <TrendingUp className="h-3 w-3" />
              Response trend up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
