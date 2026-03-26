"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { TextReveal } from "@/components/animations/TextReveal";

export const FinalCTA = () => {
  return (
    <section className="relative overflow-hidden bg-blue-50/40 px-4 py-24 dark:bg-blue-950/20 sm:px-6 lg:px-8 lg:py-36">
      <div className="absolute inset-0 animate-gradient-shift bg-[linear-gradient(135deg,#7c3aed_0%,#3b82f6_55%,#06b6d4_100%)] bg-[length:200%_200%] opacity-15" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <TextReveal
          text="Ready to Take Control of Your Internship Search?"
          as="h2"
          splitBy="chars"
          className="text-4xl font-bold tracking-[-0.02em] leading-[1.1] text-foreground sm:text-5xl lg:text-[56px]"
          staggerDelay={0.02}
        />
        <ScrollReveal delay={0.3} className="mx-auto mt-5 max-w-2xl text-muted-foreground">
          Join thousands of students who&apos;ve transformed their job search with InternIQ.
        </ScrollReveal>
        <div className="mt-12 flex justify-center">
          <MagneticButton strength={0.4}>
            <motion.div
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                href="/signup"
                className="inline-flex animate-glow-pulse items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </MagneticButton>
        </div>
        <p className="mt-6 text-xs font-medium text-muted-foreground sm:text-sm">
          No credit card required · Free forever for students · Setup in 30 seconds
        </p>
      </div>
    </section>
  );
};
