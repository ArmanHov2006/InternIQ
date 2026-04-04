"use client";

import { motion } from "framer-motion";
import { BentoCard } from "@/components/ui/bento-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { SectionReveal } from "@/components/ui/section-reveal";
import { GradientText } from "@/components/ui/gradient-text";
import { Bot, Mail, UserRound, BarChart3, Sparkles, ArrowUpRight } from "lucide-react";

const resumeHighlights = [
  { label: "Match score", value: "91%", accent: "text-primary" },
  { label: "Missing keywords", value: "3 fixes", accent: "text-accent" },
  { label: "Impact bullets", value: "6 upgraded", accent: "text-accent-warm" },
];

const profileStats = [
  { label: "Profile views", value: "84" },
  { label: "Recruiter saves", value: "12" },
];

const AITypingEffect = () => {
  return (
    <div className="mt-4 space-y-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="h-2 rounded-full bg-gradient-to-r from-primary/60 to-primary/30"
      />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "80%" }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="h-2 rounded-full bg-gradient-to-r from-accent/50 to-accent/20"
      />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "60%" }}
        transition={{ duration: 1, delay: 1.1 }}
        className="h-2 rounded-full bg-gradient-to-r from-accent-warm/40 to-accent-warm/10"
      />
    </div>
  );
};

const MiniChart = () => (
  <div className="mt-4 flex items-end gap-1.5 h-16">
    {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
      <motion.div
        key={i}
        initial={{ height: 0 }}
        animate={{ height: `${height}%` }}
        transition={{ duration: 0.5, delay: 0.1 * i }}
        className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/80 to-primary/30"
      />
    ))}
  </div>
);

export const FeaturesBento = () => {
  return (
    <section id="features" className="relative px-4 py-20 sm:py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Section header */}
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
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            A complete toolkit designed to give you an unfair advantage in your job search.
          </p>
        </SectionReveal>
      </div>
      
      {/* Bento grid */}
      <div className="mx-auto mt-12 grid max-w-7xl gap-4 md:grid-cols-2 xl:auto-rows-[minmax(220px,auto)] xl:grid-cols-4">
        {/* Large: Interactive Tracker */}
        <SectionReveal className="md:col-span-2 xl:row-span-2">
          <BentoCard className="group flex h-full flex-col transition-all duration-300 hover:scale-[1.01] hover:border-white/20 hover:shadow-glow-md" colSpan={2} rowSpan={2}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold md:text-2xl">Interactive Tracker</h3>
                <p className="mt-2 text-sm text-muted-foreground">Drag cards across columns to feel the workflow.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-3 md:p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <p className="ml-2 text-xs text-muted-foreground">interniq.app/tracker</p>
              </div>
              <div className="[transform:perspective(1000px)_rotateX(3deg)]">
                <InteractiveDemo />
              </div>
            </div>
          </BentoCard>
        </SectionReveal>

        {/* Wide: AI Resume Analysis */}
        <SectionReveal className="md:col-span-2">
          <BentoCard colSpan={2} className="group flex h-full flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-white/20 hover:shadow-glow-md">
            <div className="flex items-start gap-4">
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-primary/20 to-primary/5 p-3">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">AI Resume Analysis</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get instant feedback, fit scoring, and actionable improvements.</p>
                <AITypingEffect />
              </div>
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-3">
              {resumeHighlights.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/8 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                  <p className={`mt-2 text-lg font-semibold ${item.accent}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </BentoCard>
        </SectionReveal>

        {/* Small: Counter */}
        <SectionReveal>
          <BentoCard className="flex h-full flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-white/20 hover:shadow-glow-sm">
            <div>
              <p className="text-sm text-muted-foreground">Applications tracked</p>
              <AnimatedCounter target={50000} suffix="+" className="mt-2 text-3xl font-display text-gradient" />
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                +2,340 this week
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-muted-foreground">Saved today</p>
                <p className="mt-1 text-base font-semibold">128</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-muted-foreground">Interviews</p>
                <p className="mt-1 text-base font-semibold">42</p>
              </div>
            </div>
          </BentoCard>
        </SectionReveal>

        {/* Small: Cold Email */}
        <SectionReveal>
          <BentoCard className="group flex h-full flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-white/20 hover:shadow-glow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-accent-warm/20 to-accent-warm/5 p-2.5">
                <Mail className="h-4 w-4 text-accent-warm" />
              </div>
              <span className="rounded-full bg-accent-warm/20 px-2 py-0.5 text-xs text-accent-warm">Popular</span>
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-semibold">Cold Email Generator</h3>
              <p className="mt-1 text-sm text-muted-foreground">Personalized outreach in seconds.</p>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>Subject</span>
                <span className="text-accent-warm">Tailored</span>
              </div>
              <p className="mt-2 text-sm text-foreground/90">Quick note about your product internship opening...</p>
              <p className="mt-3 text-xs text-muted-foreground">Personal hook, company context, and CTA already drafted.</p>
            </div>
          </BentoCard>
        </SectionReveal>

        {/* Wide: Public Profile */}
        <SectionReveal className="md:col-span-2">
          <BentoCard colSpan={2} className="group flex h-full flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-white/20 hover:shadow-glow-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-accent/20 to-accent/5 p-2.5 w-fit">
                  <UserRound className="h-4 w-4 text-accent" />
                </div>
                <h3 className="mt-3 text-lg font-semibold">Public Profile</h3>
                <p className="mt-1 text-sm text-muted-foreground">Shareable portfolio with projects, skills, and achievements.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 md:min-w-[220px]">
                {profileStats.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-lg font-semibold">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-accent/40 to-primary/40" />
                  <div>
                    <div className="h-2.5 w-24 rounded bg-white/20" />
                    <div className="mt-1.5 h-2 w-16 rounded bg-white/10" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">React</span>
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">Python</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-foreground/80">SQL</span>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                  Featured projects, quantified impact, and a recruiter-ready summary in one link.
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                  Showcase your stack, internships, and wins without sending a PDF first.
                </div>
              </div>
            </div>
          </BentoCard>
        </SectionReveal>

        {/* Wide: Analytics */}
        <SectionReveal className="md:col-span-2">
          <BentoCard colSpan={2} className="flex h-full flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-white/20 hover:shadow-glow-sm">
            <div className="grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-end">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-white/10 bg-gradient-to-br from-primary/20 to-primary/5 p-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Analytics</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  See reply trends, interview momentum, and which applications deserve a follow-up first.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-foreground/80">Reply rate</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-foreground/80">Stage velocity</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-foreground/80">Best channels</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Interview rate</p>
                    <p className="mt-1 text-2xl font-semibold">18.4%</p>
                  </div>
                  <p className="text-right text-xs text-emerald-400">+4.2% this month</p>
                </div>
                <MiniChart />
              </div>
            </div>
          </BentoCard>
        </SectionReveal>
      </div>
    </section>
  );
};
