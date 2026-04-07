"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GradientText } from "@/components/ui/gradient-text";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { LandingVideoFrame } from "@/components/landing/landing-video-frame";
import { SectionReveal } from "@/components/ui/section-reveal";
import { ArrowNudgeIcon } from "@/components/ui/icons/premium-icons";
import { fadeInRight } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { ArrowUpRight, CheckCircle2, Search, Sparkles, Zap } from "lucide-react";

const HERO_WORDS = ["discovery", "fit analysis", "smart apply", "tracking"];
const HERO_SIGNAL_CHIPS = ["4 sources", "AI-ranked", "1-click apply"];

const HeroFallback = () => (
  <div className="flex h-full flex-col justify-between bg-card/70 p-4">
    <div className="space-y-2">
      {[
        { role: "Frontend Intern", company: "Vercel", source: "Greenhouse", score: "91%" },
        { role: "Product Analyst", company: "Stripe", source: "The Muse", score: "84%" },
        { role: "Design Engineer", company: "Figma", source: "Remotive", score: "79%" },
      ].map((job, index) => (
        <div key={job.role} className="rounded-md border border-border bg-card/90 p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", index === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
                <p className="text-sm font-medium text-foreground">{job.role}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {job.company} - {job.source}
              </p>
            </div>
            <span className="font-mono text-sm text-primary">{job.score}</span>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="rounded-md border border-border bg-muted/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-foreground">AI evaluation</p>
          <span className="font-mono text-xs text-primary">92%</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Strengths: React shipping, product intuition, internship-ready scope. Gap: deeper metrics examples.
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/40 p-3">
        <p className="text-xs font-medium text-foreground">Batch ready</p>
        <div className="mt-2 space-y-2">
          {["2 selected", "Resume tailored", "Answers drafted"].map((item) => (
            <div key={item} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card/90 px-3 py-2">
              <p className="text-xs text-foreground">{item}</p>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const HeroVisual = () => {
  const prefersReducedMotion = useReducedMotion();

  const shell = (
    <div id="hero-demo" className="relative mx-auto w-full max-w-2xl lg:max-w-none">
      <div className="pointer-events-none absolute inset-x-[10%] top-10 h-40 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative rounded-xl border border-border bg-card/80 p-4 shadow-glow-md backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
              <Search className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Live product demo</p>
              <p className="text-sm font-medium text-foreground">Discover to Smart Apply</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              interniq.app/discover
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Real workflow
            </span>
          </div>
        </div>

        <div className="mt-4">
          <LandingVideoFrame
            webm="/assets/videos/demo-hero-discovery.webm"
            mp4="/assets/videos/demo-hero-discovery.mp4"
            poster="/assets/videos/poster-hero-discovery.jpg"
            className="aspect-[16/10]"
            fallback={<HeroFallback />}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {HERO_SIGNAL_CHIPS.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground/90"
            >
              {chip}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-card px-3 py-1.5 text-xs font-mono text-primary shadow-sm">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            ranked live
          </span>
        </div>

        <div className="pointer-events-none absolute -bottom-4 right-4 hidden rounded-lg border border-border bg-card/90 px-3 py-2 shadow-sm md:block">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-3.5 w-3.5 text-primary" aria-hidden />
            <div>
              <p className="text-xs text-muted-foreground">Workflow</p>
              <p className="font-mono text-xs text-foreground">discover -&gt; apply</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (prefersReducedMotion) {
    return shell;
  }

  return (
    <motion.div initial="initial" animate="animate" variants={fadeInRight} transition={{ delay: 0.2 }}>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {shell}
      </motion.div>
    </motion.div>
  );
};

export const HeroSection = () => {
  const prefersReducedMotion = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % HERO_WORDS.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  return (
    <section className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:pb-24 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[5%] top-[15%] h-[320px] w-[320px] rounded-full bg-primary/15 blur-[100px] sm:h-[460px] sm:w-[460px] sm:blur-[140px]" />
        <div className="absolute bottom-[5%] right-[5%] h-[260px] w-[260px] rounded-full bg-accent/10 blur-[90px] sm:h-[360px] sm:w-[360px] sm:blur-[120px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[52%_48%] lg:gap-10">
        <div className="space-y-8">
          <SectionReveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for ambitious careers
            </span>
          </SectionReveal>

          <div className="space-y-5">
            <SectionReveal delay={0.1}>
              <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                <GradientText className="inline-block">Land Your</GradientText>
                <br />
                <GradientText className="inline-block">Next Role</GradientText>
              </h1>
            </SectionReveal>

            <SectionReveal delay={0.2}>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
                Discover internship roles across four sources, rank them with AI, track every application, and generate tailored materials without breaking focus.
              </p>
            </SectionReveal>

            <SectionReveal delay={0.25}>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Join{" "}
                <span className="font-semibold text-foreground">50,000+ job seekers</span>{" "}
                sharpening their{" "}
                {prefersReducedMotion ? (
                  <span className="inline-block font-medium text-primary">{HERO_WORDS[0]}</span>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={wordIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="inline-block font-medium text-primary"
                    >
                      {HERO_WORDS[wordIndex]}
                    </motion.span>
                  </AnimatePresence>
                )}
              </p>
            </SectionReveal>
          </div>

          <SectionReveal delay={0.3} className="flex flex-wrap items-center gap-3">
            <MagneticButton asChild className="glow-md text-base">
              <Link href="/signup" className="group">
                Start Free
                <ArrowNudgeIcon className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </MagneticButton>
            <MagneticButton
              asChild
              variant="outline"
              className="border-white/15 bg-white/[0.03] text-base hover:bg-white/[0.06]"
            >
              <Link href="#features">See Demo</Link>
            </MagneticButton>
          </SectionReveal>

          <SectionReveal delay={0.4}>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                4.9/5 from 2,400+ reviews
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
                Used daily by students, interns, and early-career operators
              </span>
            </div>
          </SectionReveal>
        </div>

        <div className="relative order-last lg:order-none">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
};

