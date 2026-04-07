"use client";

import Link from "next/link";
import { BentoCard } from "@/components/ui/bento-card";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { LandingVideoFrame } from "@/components/landing/landing-video-frame";
import { SectionReveal } from "@/components/ui/section-reveal";
import { GradientText } from "@/components/ui/gradient-text";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Bot, Mail, Sparkles, Zap } from "lucide-react";

const PIPELINE_FROM_FEATURES = "/dashboard/pipeline?from=features";
const DISCOVER_ROUTE = "/dashboard/discover";
const DISCOVERY_SOURCES = ["Adzuna", "Remotive", "Greenhouse", "The Muse"];
const TRACKER_PROOF_CHIPS = ["5 stages", "drag live", "AI signals"];

const featureCardLinkClass =
  "group block h-full min-h-0 rounded-2xl outline-none transition-shadow duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background";

const trackerHeaderLinkClass =
  "group flex items-start justify-between gap-4 rounded-lg p-1 -m-1 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background";

const DiscoveryFallback = () => (
  <div className="flex h-full flex-col bg-gradient-to-br from-card/95 via-card/90 to-muted/40 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Discovery run</p>
        <p className="mt-1 text-sm font-medium text-foreground">AI-ranked feed</p>
      </div>
      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-mono text-primary">
        12 roles
      </span>
    </div>

    <div className="mt-3 grid flex-1 gap-3 sm:grid-cols-[minmax(0,1.08fr)_minmax(220px,0.92fr)]">
      <div className="space-y-2">
        {[
          { role: "Frontend Intern", company: "Vercel", source: "Greenhouse", score: "91%" },
          { role: "Product Analyst", company: "Stripe", source: "The Muse", score: "84%" },
          { role: "Design Engineer", company: "Figma", source: "Remotive", score: "79%" },
        ].map((job, index) => (
          <div
            key={job.role}
            className={cn(
              "rounded-xl border border-border p-3 shadow-sm",
              index === 0 ? "bg-primary/5" : "bg-card/90"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", index === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
                  <p className="truncate text-sm font-medium text-foreground">{job.role}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {job.company} / {job.source}
                </p>
              </div>
              <span className="font-mono text-sm text-primary">{job.score}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card/85 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Expanded AI evaluation</p>
          <span className="rounded-full border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
            top match
          </span>
        </div>

        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-border bg-muted/25 p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Strengths</p>
            <p className="mt-2 text-xs text-muted-foreground">
              React shipping speed, product intuition, and intern-ready scope.
            </p>
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-muted/25 p-3">
            {[
              { label: "Frontend fit", value: "92%" },
              { label: "Product signal", value: "88%" },
              { label: "Resume match", value: "84%" },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="font-mono text-xs text-foreground">{metric.value}</p>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary",
                      metric.value === "92%" && "w-[92%]",
                      metric.value === "88%" && "w-[88%]",
                      metric.value === "84%" && "w-[84%]"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FitAnalysisFallback = () => (
  <div className="flex h-full flex-col bg-gradient-to-br from-card/95 via-card/90 to-muted/35 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fit analysis</p>
        <p className="mt-1 text-sm font-medium text-foreground">Role match breakdown</p>
      </div>
      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-sm text-primary">
        87%
      </span>
    </div>

    <div className="mt-4 rounded-xl border border-border bg-card/90 p-4 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Strong match</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enough alignment to apply now, with a few targeted edits.
          </p>
        </div>
        <p className="font-mono text-3xl font-semibold text-foreground">87%</p>
      </div>

      <div className="mt-4 space-y-2">
        {[
          { label: "Experience overlap", width: "w-[88%]" },
          { label: "Stack match", width: "w-[92%]" },
          { label: "Story clarity", width: "w-[74%]" },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="font-mono text-xs text-foreground">{row.width.slice(3, -2)}%</p>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div className={cn("h-full rounded-full bg-primary", row.width)} />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-muted/25 p-3">
        <p className="text-xs font-medium text-foreground">Strengths</p>
        <p className="mt-2 text-xs text-muted-foreground">Frontend depth, shipping speed, product taste.</p>
      </div>
      <div className="rounded-lg border border-border bg-muted/25 p-3">
        <p className="text-xs font-medium text-foreground">Next move</p>
        <p className="mt-2 text-xs text-muted-foreground">Tailor the resume bullets before sending the application.</p>
      </div>
    </div>
  </div>
);

const ColdEmailFallback = () => (
  <div className="flex h-full flex-col bg-gradient-to-br from-card/95 via-card/90 to-muted/35 p-4">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cold email</p>
        <p className="mt-1 text-sm font-medium text-foreground">Generated in the application drawer</p>
      </div>
      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary">
        drafted
      </span>
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      <span className="rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs text-foreground">
        Vercel
      </span>
      <span className="rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs text-foreground">
        Frontend Intern
      </span>
      <span className="rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs text-muted-foreground">
        personalized
      </span>
    </div>

    <div className="mt-3 rounded-xl border border-border bg-card/90 p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">Subject</p>
      <p className="mt-1 text-sm font-medium text-foreground">Quick note on the frontend intern opening</p>
    </div>

    <div className="mt-3 flex-1 rounded-xl border border-border bg-muted/25 p-3">
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>Hi Maya,</p>
        <p>
          I came across the frontend intern role and wanted to reach out with a quick introduction because the
          product craft at Vercel feels especially aligned with the work I enjoy.
        </p>
        <p>
          I have been building React product flows with a strong focus on speed, polish, and developer experience.
        </p>
        <p>Happy to share a few relevant projects if that would be useful.</p>
      </div>
    </div>

    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-card/90 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">Company context</p>
        <p className="mt-1 text-xs text-foreground">Included</p>
      </div>
      <div className="rounded-lg border border-border bg-card/90 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">Saved to draft</p>
        <p className="mt-1 text-xs text-foreground">Ready to refine</p>
      </div>
    </div>
  </div>
);

const SmartApplyFallback = () => (
  <div className="flex h-full flex-col bg-gradient-to-br from-card/95 via-card/90 to-muted/35 p-4">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Smart Apply</p>
        <p className="mt-1 text-sm font-medium text-foreground">Batch run across selected roles</p>
      </div>
      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary">
        3 selected
      </span>
    </div>

    <div className="mt-3 grid flex-1 gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-2">
        {[
          "Vercel Frontend Intern",
          "Stripe Product Analyst",
          "Figma Design Engineer",
        ].map((role) => (
          <div key={role} className="flex items-center gap-3 rounded-xl border border-border bg-card/90 p-3 shadow-sm">
            <span className="h-4 w-4 rounded border border-primary/30 bg-primary/10" />
            <p className="min-w-0 text-sm text-foreground">{role}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card/85 p-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Generated assets</p>
        <div className="mt-3 space-y-2">
          {[
            { item: "Resume tailored", count: "3x" },
            { item: "Cover letters drafted", count: "3x" },
            { item: "Form answers saved", count: "6x" },
          ].map((row) => (
            <div
              key={row.item}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-3 py-2"
            >
              <p className="text-sm text-foreground">{row.item}</p>
              <span className="font-mono text-xs text-primary">{row.count}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-border bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">Confirmation</p>
          <p className="mt-1 text-sm text-foreground">
            One confirmation triggers tailored material generation across the full selection.
          </p>
        </div>
      </div>
    </div>

    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-card/90 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">Jobs</p>
        <p className="mt-1 font-mono text-sm text-foreground">3</p>
      </div>
      <div className="rounded-lg border border-border bg-card/90 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">Assets</p>
        <p className="mt-1 font-mono text-sm text-foreground">12</p>
      </div>
      <div className="rounded-lg border border-border bg-card/90 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">Confirmations</p>
        <p className="mt-1 font-mono text-sm text-foreground">1</p>
      </div>
    </div>
  </div>
);

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
        <SectionReveal delay={0.05} className="md:col-span-2 xl:row-span-2">
          <BentoCard className="flex h-full flex-col">
            <Link href={PIPELINE_FROM_FEATURES} aria-label="Open pipeline - kanban board" className={trackerHeaderLinkClass}>
              <div className="min-w-0 flex-1 text-left">
                <h3 className="text-xl font-semibold md:text-2xl">Interactive Tracker</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click stages, inspect a focused application panel, and drag cards across the pipeline without losing context.
                </p>
              </div>
              <span className="shrink-0 rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
            <div className="mt-3 flex flex-wrap gap-2">
              {TRACKER_PROOF_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-border bg-muted/35 px-2.5 py-1 text-xs text-foreground/90"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card/95 via-card/85 to-muted/45 p-3 md:mt-5 md:p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
                  <span className="h-2.5 w-2.5 rounded-full bg-status-offer/70" />
                  <p className="ml-2 font-mono text-xs text-muted-foreground">interniq.app/pipeline</p>
                </div>
                <span className="rounded-full border border-border bg-card/80 px-2.5 py-1 text-xs text-muted-foreground">
                  live workspace
                </span>
              </div>
              <div className="[transform:perspective(1000px)_rotateX(3deg)]">
                <InteractiveDemo />
              </div>
            </div>
          </BentoCard>
        </SectionReveal>

        <SectionReveal delay={0.1} className="md:col-span-2">
          <Link href={DISCOVER_ROUTE} aria-label="Open discover - AI job discovery" className={featureCardLinkClass}>
            <BentoCard className="flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="rounded-lg border border-border bg-primary/10 p-2.5">
                    <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-xl font-semibold">Job Discovery</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Auto-find roles from Adzuna, Remotive, Greenhouse &amp; The Muse, then rank them against your profile with AI.
                    </p>
                  </div>
                </div>
                <span className="rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {DISCOVERY_SOURCES.map((source) => (
                  <span
                    key={source}
                    className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground/90"
                  >
                    {source}
                  </span>
                ))}
              </div>

              <div className="relative">
                <LandingVideoFrame
                  webm="/assets/videos/demo-discovery.webm"
                  mp4="/assets/videos/demo-discovery.mp4"
                  poster="/assets/videos/poster-discovery.jpg"
                  className="aspect-[16/9] sm:aspect-[2.15/1]"
                  fallback={<DiscoveryFallback />}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-card via-card/80 to-transparent p-4">
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">Job Discovery</p>
                    <p className="mt-1 text-xs text-muted-foreground">Four sources in one feed, scored before you even open the drawer.</p>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-card/90 px-2.5 py-1 text-xs font-mono text-primary shadow-sm">
                    4 sources
                  </span>
                </div>
              </div>
            </BentoCard>
          </Link>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <Link href={PIPELINE_FROM_FEATURES} aria-label="Open pipeline - AI fit analysis" className={featureCardLinkClass}>
            <BentoCard className="flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="rounded-lg border border-border bg-primary/10 p-2.5">
                    <Bot className="h-4 w-4 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-lg font-semibold">AI Fit Analysis</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Instant scoring with strengths, gaps, and suggestions that explain why a role is worth your time.
                    </p>
                  </div>
                </div>
                <span className="rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </div>

              <div className="relative">
                <LandingVideoFrame
                  webm="/assets/videos/demo-fit-score.webm"
                  mp4="/assets/videos/demo-fit-score.mp4"
                  poster="/assets/videos/poster-fit-score.jpg"
                  className="aspect-[4/3] min-h-[220px]"
                  fallback={<FitAnalysisFallback />}
                />
                <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-primary/20 bg-card/90 px-2.5 py-1 text-xs font-mono text-primary shadow-sm">
                  87%
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/80 to-transparent p-4">
                  <p className="text-sm font-semibold text-card-foreground">AI Fit Analysis</p>
                  <p className="mt-1 text-xs text-muted-foreground">Know the strengths, missing signals, and next fixes before you apply.</p>
                </div>
              </div>
            </BentoCard>
          </Link>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <Link href={PIPELINE_FROM_FEATURES} aria-label="Open pipeline - cold email generator" className={featureCardLinkClass}>
            <BentoCard className="flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="rounded-lg border border-border bg-primary/10 p-2.5">
                    <Mail className="h-4 w-4 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-lg font-semibold">Cold Email Generator</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Personalized outreach in seconds with job-specific context already woven in.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">Popular</span>
                  <span className="rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </div>

              <div className="relative">
                <LandingVideoFrame
                  webm="/assets/videos/demo-cold-email.webm"
                  mp4="/assets/videos/demo-cold-email.mp4"
                  poster="/assets/videos/poster-cold-email.jpg"
                  className="aspect-[4/3] min-h-[220px]"
                  fallback={<ColdEmailFallback />}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/80 to-transparent p-4">
                  <p className="text-sm font-semibold text-card-foreground">Cold Email Generator</p>
                  <p className="mt-1 text-xs text-muted-foreground">Generate a concise, role-aware outreach draft directly from the application context.</p>
                </div>
              </div>
            </BentoCard>
          </Link>
        </SectionReveal>

        <SectionReveal delay={0.25} className="md:col-span-2 xl:col-span-4">
          <Link href={DISCOVER_ROUTE} aria-label="Open discover - smart apply workflow" className={featureCardLinkClass}>
            <BentoCard className="h-full">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:items-center">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className="rounded-lg border border-border bg-primary/10 p-2.5">
                          <Zap className="h-5 w-5 text-primary" aria-hidden />
                        </div>
                        <div className="min-w-0 text-left">
                          <h3 className="text-xl font-semibold md:text-2xl">Smart Apply</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Select a handful of roles, confirm once, and let InternIQ generate the tailored material stack for each one.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-border bg-muted/25 p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Selected</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-foreground">4 jobs</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/25 p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Generated</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-foreground">12 assets</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/25 p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Time saved</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-foreground">3.4 hrs</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["discover", "rank", "confirm once", "generate everything"].map((step) => (
                      <span
                        key={step}
                        className="rounded-full border border-border bg-muted/25 px-2.5 py-1 text-xs text-foreground/90"
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <LandingVideoFrame
                    webm="/assets/videos/demo-smart-apply.webm"
                    mp4="/assets/videos/demo-smart-apply.mp4"
                    poster="/assets/videos/poster-smart-apply.jpg"
                    className="aspect-[16/9] min-h-[260px]"
                    fallback={<SmartApplyFallback />}
                  />
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-primary/20 bg-card/90 px-2.5 py-1 text-xs font-mono text-primary shadow-sm">
                    1 click
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/80 to-transparent p-4">
                    <p className="text-sm font-semibold text-card-foreground">Smart Apply</p>
                    <p className="mt-1 text-xs text-muted-foreground">Queue multiple jobs, confirm once, and let InternIQ tailor every application artifact.</p>
                  </div>
                </div>
              </div>
            </BentoCard>
          </Link>
        </SectionReveal>
      </div>
    </section>
  );
};
