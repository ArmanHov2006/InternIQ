"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientText } from "@/components/ui/gradient-text";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { SectionReveal } from "@/components/ui/section-reveal";
import { ArrowNudgeIcon } from "@/components/ui/icons/premium-icons";
import { Sparkles, TrendingUp, Users, Zap } from "lucide-react";

const HeroVisual = () => (
  <div id="hero-demo" className="relative flex h-[520px] w-full items-center justify-center">
    {/* Ambient glow */}
    <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-[100px]" />

    <div className="relative flex w-full max-w-md flex-col items-center gap-5">
      {/* Main card */}
      <motion.div
        animate={{ rotateY: [0, 3, -3, 0], rotateX: [0, 2, -2, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-glow-md [perspective:1200px]"
      >
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,oklch(0.65_0.25_265_/_15%),transparent_50%)]" />
        <div className="relative p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Application Tracker</span>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">Live</span>
          </div>

          <div className="mt-5 space-y-3">
            {["Applied to Google", "Interview at Meta", "Offer from Stripe"].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.2 }}
                className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
              >
                <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-blue-400' : i === 1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className="text-sm">{item}</span>
                <Zap className="ml-auto h-3 w-3 text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stat cards row — stacked below, not overlapping */}
      <div className="flex w-full gap-4">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="flex-1 rounded-2xl border border-accent-cyan/30 bg-gradient-to-br from-accent-cyan/15 to-accent-cyan/5 backdrop-blur-xl p-4"
        >
          <div className="flex items-center gap-2 text-accent-cyan">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Response Rate</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gradient">+89%</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "89%" }}
              transition={{ duration: 2, delay: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent"
            />
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          className="flex-1 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 backdrop-blur-xl p-4"
        >
          <div className="flex items-center gap-2 text-accent">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Active Users</span>
          </div>
          <p className="mt-2 text-xl font-bold">12,847</p>
          <div className="mt-2 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 8 }}
                animate={{ height: [8, 16 + i * 4, 8] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                className="w-2 rounded-full bg-accent/60"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);

export const HeroSection = () => {
  const words = ["tracking", "portfolios", "cold outreach", "AI analysis"];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [words.length]);

  return (
    <section className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:pb-24 sm:pt-32">
      {/* Dot grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div 
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[5%] top-[15%] h-[320px] w-[320px] sm:h-[480px] sm:w-[480px] rounded-full bg-primary/15 blur-[100px] sm:blur-[140px]" 
        />
        <motion.div 
          animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[5%] right-[5%] h-[280px] w-[280px] sm:h-[400px] sm:w-[400px] rounded-full bg-accent/12 blur-[90px] sm:blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[45%] top-[40%] h-[200px] w-[200px] sm:h-[300px] sm:w-[300px] -translate-x-1/2 rounded-full bg-accent-cyan/10 blur-[80px] sm:blur-[100px]" 
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[55%_45%] lg:gap-8">
        {/* Left: Content */}
        <div className="space-y-8">
          <SectionReveal>
            <motion.span 
              whileHover={{ scale: 1.02 }}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for ambitious careers
            </motion.span>
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
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
                AI-powered tracking, polished public profiles, and outreach that earns replies. The complete toolkit for modern job seekers.
              </p>
            </SectionReveal>
            
            <SectionReveal delay={0.25}>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Join{" "}
                <span className="font-semibold text-foreground">50,000+ job seekers</span>{" "}
                sharpening their{" "}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="inline-block text-gradient font-medium"
                  >
                    {words[wordIndex]}
                  </motion.span>
                </AnimatePresence>
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
          
          {/* Social proof mini-row */}
          <SectionReveal delay={0.4}>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-primary/40 to-accent/40"
                  />
                ))}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-foreground">4.9/5</span>
                <span className="text-muted-foreground"> from 2,400+ reviews</span>
              </div>
            </div>
          </SectionReveal>
        </div>

        {/* Right: Visual */}
        <motion.div
          className="relative hidden lg:block"
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
};
