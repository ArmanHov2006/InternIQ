"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BentoCard } from "@/components/ui/bento-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { SectionReveal } from "@/components/ui/section-reveal";
import { GradientText } from "@/components/ui/gradient-text";
import { cn } from "@/lib/utils";
import { Bot, Mail, UserRound, BarChart3, Sparkles, ArrowUpRight } from "lucide-react";

const PIPELINE_FROM_FEATURES = "/dashboard/pipeline?from=features";

const featureCardLinkClass =
  "block h-full min-h-0 rounded-2xl outline-none transition-shadow duration-150 ease-out hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background";

const trackerHeaderLinkClass =
  "flex items-start justify-between gap-4 rounded-lg p-1 -m-1 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background";

const resumeHighlights = [
  { label: "Match score", value: "91%", accent: "text-primary" },
  { label: "Missing keywords", value: "3 fixes", accent: "text-accent" },
  { label: "Impact bullets", value: "6 upgraded", accent: "text-accent-cyan" },
];

const profileStats = [
  { label: "Profile views", value: "84" },
  { label: "Recruiter saves", value: "12" },
];

const AITypingEffect = () => {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className="mt-4 space-y-2">
        <div className="h-2 w-full rounded-full bg-primary/25" />
        <div className="h-2 w-[80%] rounded-full bg-primary/20" />
        <div className="h-2 w-[60%] rounded-full bg-muted-foreground/25" />
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="h-2 rounded-full bg-primary/25"
      />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "80%" }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="h-2 rounded-full bg-primary/20"
      />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "60%" }}
        transition={{ duration: 1, delay: 1.1 }}
        className="h-2 rounded-full bg-muted-foreground/25"
      />
    </div>
  );
};

const chartHeights = [40, 65, 45, 80, 55, 90, 70];

const MiniChart = () => {
  const reduce = useReducedMotion();
  return (
    <div className="mt-4 flex h-16 items-end gap-1.5">
      {chartHeights.map((height, i) =>
        reduce ? (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t-sm",
              i % 2 === 0 ? "bg-primary/60" : "bg-accent-cyan/60"
            )}
            style={{ height: `${height}%` }}
          />
        ) : (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.5, delay: 0.1 * i }}
            className={cn(
              "flex-1 rounded-t-sm",
              i % 2 === 0 ? "bg-primary/70" : "bg-accent-cyan/70"
            )}
          />
        )
      )}
    </div>
  );
};

export const FeaturesBento = () => {
  return (
    <section id="features" className="relative px-4 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="mx-auto max-w-7xl text-center">
        <SectionReveal>
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Features
          </span>
        </SectionReveal>
        <SectionReveal delay={0.1}>
          <h2 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl">
            <GradientText>Everything You Need</GradientText>
          </h2>
        </SectionReveal>
        <SectionReveal delay={0.2}>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            A complete toolkit designed to give you an unfair advantage in your job search.
          </p>
        </SectionReveal>
      </div>

      <div className="mx-auto mt-12 grid max-w-7xl gap-4 md:grid-cols-2 xl:auto-rows-[minmax(220px,auto)] xl:grid-cols-4">
        {/* Large: Interactive Tracker — demo + header link only */}
        <SectionReveal className="md:col-span-2 xl:row-span-2">
          <BentoCard className="flex h-full flex-col">
            <Link
              href={PIPELINE_FROM_FEATURES}
              aria-label="Open pipeline — kanban board"
              className={cn(trackerHeaderLinkClass, "group")}
            >
              <div className="min-w-0 flex-1 text-left">
                <h3 className="text-xl font-semibold md:text-2xl">Interactive Tracker</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag cards across columns to feel the workflow.
                </p>
              </div>
              <span className="shrink-0 rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              Open the full pipeline to manage applications and drag cards between stages.
            </p>
            <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-border bg-muted/30 p-3 md:mt-5 md:p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <p className="ml-2 font-mono text-xs text-muted-foreground">interniq.app/pipeline</p>
              </div>
              <div className="[transform:perspective(1000px)_rotateX(3deg)]">
                <InteractiveDemo />
              </div>
            </div>
          </BentoCard>
        </SectionReveal>

        {/* Wide: AI Resume Analysis */}
        <SectionReveal className="md:col-span-2">
          <Link
            href={PIPELINE_FROM_FEATURES}
            aria-label="Open pipeline — resume and AI tools"
            className={featureCardLinkClass}
          >
            <BentoCard className="flex h-full flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-xl border border-border bg-primary/10 p-3">
                  <Bot className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold">AI Resume Analysis</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get instant feedback, fit scoring, and actionable improvements — from any application
                    in the pipeline.
                  </p>
                  <AITypingEffect />
                </div>
              </div>
              <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-3">
                {resumeHighlights.map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-card/80 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className={cn("mt-2 text-lg font-semibold font-mono tabular-nums", item.accent)}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </BentoCard>
          </Link>
        </SectionReveal>

        {/* Small: Counter */}
        <SectionReveal>
          <Link href="/dashboard" aria-label="Open dashboard — applications overview" className={featureCardLinkClass}>
            <BentoCard className="flex h-full flex-col justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications tracked</p>
                <AnimatedCounter
                  target={50000}
                  suffix="+"
                  className="mt-2 font-mono text-3xl font-semibold tabular-nums text-gradient"
                />
                <div className="mt-3 flex items-center gap-1.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  +2,340 this week
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-muted-foreground">Saved today</p>
                  <p className="mt-1 font-mono text-base font-semibold tabular-nums">128</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-muted-foreground">Interviews</p>
                  <p className="mt-1 font-mono text-base font-semibold tabular-nums">42</p>
                </div>
              </div>
            </BentoCard>
          </Link>
        </SectionReveal>

        {/* Small: Cold Email */}
        <SectionReveal>
          <Link
            href={PIPELINE_FROM_FEATURES}
            aria-label="Open pipeline — cold email from applications"
            className={featureCardLinkClass}
          >
            <BentoCard className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="rounded-xl border border-border bg-primary/10 p-2.5">
                  <Mail className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  Popular
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-semibold">Cold Email Generator</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Personalized outreach in seconds — generate from any application in the pipeline.
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>Subject</span>
                  <span className="text-primary">Tailored</span>
                </div>
                <p className="mt-2 text-sm text-foreground">Quick note about your product internship opening...</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Personal hook, company context, and CTA already drafted.
                </p>
              </div>
            </BentoCard>
          </Link>
        </SectionReveal>

        {/* Wide: Public Profile */}
        <SectionReveal className="md:col-span-2">
          <Link
            href="/dashboard/settings?section=profile"
            aria-label="Open settings — profile and public profile"
            className={featureCardLinkClass}
          >
            <BentoCard className="flex h-full flex-col justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="w-fit rounded-xl border border-border bg-accent/10 p-2.5">
                    <UserRound className="h-4 w-4 text-accent" aria-hidden />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">Public Profile</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Shareable portfolio with projects, skills, and achievements.
                  </p>
                </div>
                <div className="grid min-w-0 grid-cols-2 gap-2 md:min-w-[220px]">
                  {profileStats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border bg-muted/30 p-3 text-center"
                    >
                      <p className="font-mono text-lg font-semibold tabular-nums">{item.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="rounded-xl border border-border bg-card/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-accent/40 to-primary/40" />
                    <div>
                      <div className="h-2.5 w-24 rounded bg-muted-foreground/25" />
                      <div className="mt-1.5 h-2 w-16 rounded bg-muted-foreground/15" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">React</span>
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">Python</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground/90">SQL</span>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="rounded-xl border border-border bg-card/80 px-3 py-2.5">
                    Featured projects, quantified impact, and a recruiter-ready summary in one link.
                  </div>
                  <div className="rounded-xl border border-border bg-card/80 px-3 py-2.5">
                    Showcase your stack, internships, and wins without sending a PDF first.
                  </div>
                </div>
              </div>
            </BentoCard>
          </Link>
        </SectionReveal>

        {/* Wide: Analytics */}
        <SectionReveal className="md:col-span-2">
          <Link href="/dashboard/insights" aria-label="Open insights — analytics" className={featureCardLinkClass}>
            <BentoCard className="flex h-full flex-col justify-between">
              <div className="grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-end">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-border bg-primary/10 p-2">
                      <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold">Analytics</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    See reply trends, interview momentum, and which applications deserve a follow-up first.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-foreground/90">
                      Reply rate
                    </span>
                    <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-foreground/90">
                      Stage velocity
                    </span>
                    <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-foreground/90">
                      Best channels
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Interview rate</p>
                      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">18.4%</p>
                    </div>
                    <p className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      +4.2% this month
                    </p>
                  </div>
                  <MiniChart />
                </div>
              </div>
            </BentoCard>
          </Link>
        </SectionReveal>
      </div>
    </section>
  );
};
