"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GradientText } from "@/components/ui/gradient-text";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { SectionReveal } from "@/components/ui/section-reveal";
import { ArrowNudgeIcon } from "@/components/ui/icons/premium-icons";

const HeroFallback = () => (
  <div className="relative h-[380px] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/15 via-accent/10 to-accent-cyan/10">
    <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[80px] animate-pulse" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.65_0.25_265_/_20%),transparent_45%)]" />
    <motion.div
      animate={{ rotateY: [0, 8, -8, 0], rotateX: [0, 3, -3, 0], y: [0, -8, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-1/2 top-1/2 h-56 w-80 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]"
    >
      <div className="glass absolute inset-0 rounded-2xl border-white/15" />
      <div className="glass absolute -right-8 -top-8 h-36 w-56 rounded-2xl border-accent/30 bg-accent/10" />
      <div className="glass absolute -bottom-8 -left-10 h-28 w-48 rounded-2xl border-accent-cyan/30 bg-accent-cyan/10" />
    </motion.div>
  </div>
);

export const HeroSection = () => {
  const words = ["tracking", "portfolios", "cold outreach", "AI analysis"];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [words.length]);

  return (
    <section className="relative min-h-screen px-4 pb-20 pt-28">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-20 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[100px] animate-float" />
        <div className="absolute bottom-0 right-4 h-[440px] w-[440px] rounded-full bg-accent/20 blur-[100px] animate-float" />
        <div className="absolute left-1/2 top-1/3 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-accent-cyan/20 blur-[90px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[60%_40%]">
        <div className="space-y-8">
          <SectionReveal>
            <span className="glass inline-flex rounded-full px-4 py-1 text-sm">Built for ambitious careers</span>
          </SectionReveal>

          <div className="space-y-4">
            <h1 className="font-display text-6xl leading-[0.9] md:text-7xl lg:text-8xl">
              <GradientText>Land Your Next Role</GradientText>
            </h1>
            <SectionReveal delay={0.2}>
              <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
                AI-powered tracking, polished public profiles, and outreach that earns replies.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.25}>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Trusted by{" "}
                <span className="font-medium text-foreground">thousands of job seekers</span>{" "}
                sharpening their <span className="text-gradient">{words[wordIndex]}</span>.
              </p>
            </SectionReveal>
          </div>

          <SectionReveal delay={0.3} className="flex flex-wrap gap-3">
            <MagneticButton asChild className="glow-md">
              <Link href="/signup" className="group">
                Start Free
                <ArrowNudgeIcon className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </MagneticButton>
            <MagneticButton
              asChild
              variant="outline"
              className="border-white/20 bg-white/[0.02]"
            >
              <Link href="#features">See Demo</Link>
            </MagneticButton>
          </SectionReveal>
        </div>

        <motion.div
          className="relative lg:pt-2"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute right-0 top-0 h-full w-full">
            <HeroFallback />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
