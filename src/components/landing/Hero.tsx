"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, PlayCircle, Sparkles } from "lucide-react";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { TextReveal } from "@/components/animations/TextReveal";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { HeroSpline } from "@/components/landing/HeroSpline";
import { BrowserFrame } from "@/components/landing/ProductMockup";
import { AppWorkflowPlayback } from "@/components/landing/AppWorkflowPlayback";

const schools = ["Stanford", "MIT", "Harvard", "Berkeley", "Columbia"];

export const Hero = () => {
  return (
    <section className="aurora-bg relative min-h-screen overflow-hidden bg-background px-4 pt-14 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-[-14%] z-0 h-[68%] w-[90%] -translate-x-1/2 opacity-55 [filter:brightness(1.18)_saturate(1.1)] sm:top-[-18%] sm:h-[72%] sm:w-[82%] lg:top-[-22%] lg:h-[78%] lg:w-[70%] dark:opacity-70 dark:[filter:brightness(1.35)_saturate(1.18)]">
        <HeroSpline />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/75 via-background/62 to-background/88 dark:from-background/84 dark:via-background/74 dark:to-background/94" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center py-12 text-center sm:py-16 lg:py-24">
        <motion.div
          initial={{ y: 20, opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
        >
          <Sparkles className="h-4 w-4" />
          The #1 Platform for Intern Job Seekers
        </motion.div>

        <TextReveal
          text="Land Your Dream Internship,"
          as="h1"
          trigger="load"
          splitBy="words"
          className="text-balance text-5xl font-bold tracking-[-0.03em] leading-[1.05] text-foreground sm:text-6xl lg:text-7xl xl:text-[80px]"
        />
        <TextReveal
          text="Organized"
          as="h1"
          trigger="load"
          splitBy="words"
          className="mt-1 bg-[linear-gradient(135deg,#6d28d9_0%,#2563eb_50%,#06b6d4_100%)] bg-clip-text text-5xl font-extrabold tracking-[-0.03em] leading-[1.05] text-transparent sm:text-6xl lg:text-7xl xl:text-[80px]"
          staggerDelay={0.08}
        />

        <TextReveal
          text="Track applications, build your portfolio, and stand out with AI-powered tools — all in one place designed for ambitious students."
          as="p"
          trigger="load"
          splitBy="lines"
          className="mt-6 max-w-3xl text-base text-muted-foreground sm:text-lg lg:text-xl"
          staggerDelay={0.12}
        />

        <ScrollReveal direction="up" delay={1.2} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <MagneticButton strength={0.4}>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3 font-semibold text-white shadow-[0_16px_40px_rgba(59,130,246,0.28)] hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </MagneticButton>
          <MagneticButton strength={0.32}>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3 font-semibold text-foreground"
            >
              <PlayCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              See How It Works
            </a>
          </MagneticButton>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={1.5} distance={80} className="mt-16 w-full max-w-5xl">
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <BrowserFrame
              url="interniq.com/dashboard"
              className="border-blue-200/40 dark:border-blue-500/30"
            >
              <AppWorkflowPlayback />
            </BrowserFrame>
          </motion.div>
        </ScrollReveal>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-10 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground/75">Trusted by students at</span>
          {schools.map((school) => (
            <span key={school} className="font-medium">
              {school}
            </span>
          ))}
        </div>
      </div>
      <motion.div
        className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/80"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <ChevronDown className="h-6 w-6" />
      </motion.div>
    </section>
  );
};
