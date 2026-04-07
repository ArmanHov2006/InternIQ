"use client";

import Link from "next/link";
import { BentoCard } from "@/components/ui/bento-card";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { LandingVideoFrame } from "@/components/landing/landing-video-frame";
import { SectionReveal } from "@/components/ui/section-reveal";
import { GradientText } from "@/components/ui/gradient-text";
import { ArrowUpRight, Bot, Mail, Sparkles, Zap } from "lucide-react";

const PIPELINE_FROM_FEATURES = "/dashboard/pipeline?from=features";
const DISCOVER_ROUTE = "/dashboard/discover";
const DISCOVERY_SOURCES = ["Adzuna", "Remotive", "Greenhouse", "The Muse"];

const featureCardLinkClass =
  "group block h-full min-h-0 rounded-2xl outline-none transition-shadow duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background";

const trackerHeaderLinkClass =
  "group flex items-start justify-between gap-4 rounded-lg p-1 -m-1 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background";

const DiscoveryFallback = () => (
  <div className="flex h-full flex-col justify-between bg-card/70 p-4">
    <div className="space-y-2">
      {[
        { role: "Frontend Intern", company: "Vercel", score: "91%" },
        { role: "Product Analyst", company: "Stripe", score: "84%" },
        { role: "Design Engineer", company: "Figma", score: "79%" },
      ].map((job) => (
        <div key={job.role} className="rounded-md border border-border bg-card/90 p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{job.role}</p>
              <p className="mt-1 text-xs text-muted-foreground">{job.company}</p>
            </div>
            <span className="font-mono text-sm text-primary">{job.score}</span>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-3 rounded-md border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">AI evaluation</p>
        <span className="font-mono text-xs text-primary">top match</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Strengths: React shipping, product intuition, internship-ready scope. Gap: analytics depth.
      </p>
    </div>
  </div>
);

const FitAnalysisFallback = () => (
  <div className="flex h-full flex-col justify-between bg-card/70 p-4">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Fit analysis</p>
        <p className="mt-1 text-sm font-medium text-foreground">Role match breakdown</p>
      </div>
      <span className="font-mono text-lg font-semibold text-primary">87%</span>
    </div>
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-card/90 p-3">
        <p className="text-xs font-medium text-foreground">Strengths</p>
        <p className="mt-1 text-xs text-muted-foreground">Frontend depth, shipping speed, product taste.</p>
      </div>
      <div className="rounded-md border border-border bg-card/90 p-3">
        <p className="text-xs font-medium text-foreground">Gaps</p>
        <p className="mt-1 text-xs text-muted-foreground">System design examples and experimentation metrics.</p>
      </div>
      <div className="rounded-md border border-border bg-card/90 p-3">
        <p className="text-xs font-medium text-foreground">Next move</p>
        <p className="mt-1 text-xs text-muted-foreground">Tailor the resume bullets before sending the application.</p>
      </div>
    </div>
  </div>
);

const ColdEmailFallback = () => (
  <div className="flex h-full flex-col bg-card/70 p-4">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Cold email</p>
      <span className="rounded-full border border-border bg-card/90 px-2 py-0.5 text-xs text-primary">drafted</span>
    </div>
    <div className="mt-3 rounded-md border border-border bg-card/90 p-3">
      <p className="text-xs text-muted-foreground">Subject</p>
      <p className="mt-1 text-sm font-medium text-foreground">Quick note on your summer intern opening</p>
    </div>
    <div className="mt-3 flex-1 rounded-md border border-border bg-muted/40 p-3">
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>Hi Maya,</p>
        <p>I noticed the team is hiring a frontend intern and wanted to reach out with a short intro.</p>
        <p>I have been building React product flows and would love to contribute to the team this summer.</p>
        <p>Happy to share work samples if helpful.</p>
      </div>
    </div>
  </div>
);

const SmartApplyFallback = () => (
  <div className="grid h-full gap-3 bg-card/70 p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
    <div className="space-y-2">
      {[
        "Vercel Frontend Intern",
        "Stripe Product Analyst",
        "Figma Design Engineer",
      ].map((role) => (
        <div key={role} className="flex items-center gap-3 rounded-md border border-border bg-card/90 p-3 shadow-sm">
          <span className="h-4 w-4 rounded border border-primary/30 bg-primary/10" />
          <p className="min-w-0 text-sm text-foreground">{role}</p>
        </div>
      ))}
    </div>
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Generated assets</p>
      <div className="mt-3 space-y-2">
        {[
          "Resume tailored",
          "Cover letter drafted",
          "Form answers saved",
        ].map((item) => (
          <div key={item} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/90 px-3 py-2">
            <p className="text-sm text-foreground">{item}</p>
            <span className="font-mono text-xs text-primary">done</span>
          </div>
        ))}
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
                  Drag real application cards across five pipeline stages to feel how InternIQ keeps momentum visible.
                </p>
              </div>
              <span className="shrink-0 rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Built from the same status model as the product pipeline, with fit scores and AI completion hints on key roles.
            </p>
            <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-border bg-muted/30 p-3 md:mt-5 md:p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-status-offer/70" />
                <p className="ml-2 font-mono text-xs text-muted-foreground">interniq.app/pipeline</p>
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
                  <p className="mt-1 text-xs text-muted-foreground">Switch tone, generate the draft, and send a sharper first message.</p>
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
                            Select jobs, click once, and generate tailored resumes, cover letters, and application answers for every role in the batch.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Selected</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-foreground">4 jobs</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Generated</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-foreground">12 assets</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Time saved</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-foreground">3.4 hrs</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    This is the compounding workflow: discover, rank, select, and ship tailored materials without breaking focus.
                  </p>
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
