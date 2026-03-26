"use client";

import { ArrowRight, CheckCircle2, KanbanSquare, Sparkles, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { TextReveal } from "@/components/animations/TextReveal";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { TiltCard } from "@/components/animations/TiltCard";
import { CountUp } from "@/components/animations/CountUp";

const steps = [
  {
    icon: KanbanSquare,
    title: "Track Applications",
    description:
      "Capture every opportunity in one pipeline with drag-and-drop stages and instant status clarity.",
    unlock: "Never lose track of deadlines or follow-ups.",
    stat: 1,
    statLabel: "source of truth",
  },
  {
    icon: UserRound,
    title: "Build Your Portfolio",
    description:
      "Turn your profile into a recruiter-ready page with projects, experience, skills, and a shareable URL.",
    unlock: "Send one link instead of scattered PDFs and docs.",
    stat: 1,
    statLabel: "shareable profile",
  },
  {
    icon: Sparkles,
    title: "Stand Out with AI",
    description:
      "Score role-fit, improve positioning, and generate personalized outreach that gets faster responses.",
    unlock: "Focus time only on high-probability opportunities.",
    stat: 3,
    statLabel: "AI copilots",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-background px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute right-[-120px] top-1/3 h-[240px] w-[240px] rounded-full bg-cyan-100/50 blur-3xl dark:bg-cyan-500/20" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal className="text-center">
          <span className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            How It Works
          </span>
        </ScrollReveal>
        <TextReveal
          text="Three Steps to Internship Success"
          as="h2"
          splitBy="words"
          className="text-center text-4xl font-bold tracking-[-0.02em] leading-[1.1] text-foreground sm:text-5xl lg:text-[56px]"
        />
        <ScrollReveal delay={0.2} className="mt-5 text-center text-muted-foreground">
          One focused system for pipeline tracking, portfolio credibility, and AI-powered execution.
        </ScrollReveal>

        <div className="mx-auto mt-12 hidden max-w-4xl items-center px-8 md:flex">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-200 via-indigo-200 to-cyan-200" />
          <div className="mx-4 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-card/80 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/40 dark:text-blue-300">
            Product Workflow
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-200 via-indigo-200 to-blue-200" />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <ScrollReveal key={step.title} delay={index * 0.15}>
              <TiltCard maxTilt={10} className="h-full">
                <motion.div
                  initial="rest"
                  whileHover="hover"
                  variants={{
                    rest: { y: 0, boxShadow: "0 10px 26px rgba(15, 36, 64, 0.05)" },
                    hover: {
                      y: -6,
                      boxShadow: "0 26px 44px rgba(15, 36, 64, 0.14)",
                      transition: { type: "spring", stiffness: 300, damping: 20 },
                    },
                  }}
                  className="relative h-full overflow-hidden rounded-2xl border border-border bg-muted/35 p-8"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
                  <div className="mb-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    <CountUp end={index + 1} duration={0.5} />
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.2 }}
                  >
                    <step.icon className="mb-4 h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  <div className="mt-5 flex items-start gap-2 rounded-lg border border-blue-100 bg-card/70 p-3 dark:border-blue-500/30">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs leading-5 text-foreground/80">{step.unlock}</p>
                  </div>
                  <div className="mt-5 flex items-end justify-between border-t border-blue-100/80 pt-4 dark:border-blue-500/30">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Outcome</p>
                      <p className="text-sm font-semibold text-foreground">{step.statLabel}</p>
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-300">
                      <CountUp end={step.stat} duration={0.8} />x
                    </p>
                  </div>
                </motion.div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
