"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GradientText } from "@/components/ui/gradient-text";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { SectionReveal } from "@/components/ui/section-reveal";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

const features = [
  { icon: Zap, text: "Instant setup" },
  { icon: Shield, text: "No credit card required" },
  { icon: Sparkles, text: "Free forever plan" },
];

export const CtaSection = () => {
  return (
    <section className="relative px-4 py-24 sm:py-32">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[10%] top-[25%] h-32 w-32 rounded-full bg-primary/25 blur-[60px]" 
        />
        <motion.div 
          animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute right-[15%] top-[30%] h-28 w-28 rounded-full bg-accent/20 blur-[50px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[45%] h-36 w-36 rounded-full bg-accent-warm/15 blur-[70px]" 
        />
      </div>
      
      <SectionReveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10">
          {/* Gradient mesh background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent-warm/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.65_0.25_265_/_15%),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,oklch(0.75_0.15_195_/_12%),transparent_50%)]" />
          
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:20px_20px]" />
          
          {/* Content */}
          <div className="relative px-8 py-16 text-center sm:px-12 sm:py-20">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Start your journey today
              </span>
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <GradientText>Your Career Breakthrough</GradientText>
              <br />
              <GradientText>Starts Here</GradientText>
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
            >
              Join 50,000+ professionals who are landing their dream roles with InternIQ&apos;s AI-powered toolkit.
            </motion.p>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <MagneticButton asChild size="lg" className="glow-lg text-base">
                <Link href="/signup" className="group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </MagneticButton>
              <MagneticButton
                asChild
                variant="outline"
                size="lg"
                className="border-white/15 bg-white/[0.03] text-base"
              >
                <Link href="/demo">Watch Demo</Link>
              </MagneticButton>
            </motion.div>
            
            {/* Feature pills */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              {features.map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground"
                >
                  <feature.icon className="h-4 w-4 text-primary" />
                  {feature.text}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
};
