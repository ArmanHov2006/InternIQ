"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionReveal } from "@/components/ui/section-reveal";
import { GradientText } from "@/components/ui/gradient-text";
import { TrendingUp, Users, Target, Award, Sparkles } from "lucide-react";

const stats = [
  { 
    value: 50000, 
    suffix: "+", 
    label: "Applications Tracked",
    description: "And counting daily",
    icon: TrendingUp,
    color: "from-primary/30 to-primary/10"
  },
  { 
    value: 12000, 
    suffix: "+", 
    label: "Resumes Analyzed",
    description: "AI-powered insights",
    icon: Users,
    color: "from-accent/30 to-accent/10"
  },
  { 
    value: 89, 
    suffix: "%", 
    label: "Fit Score Boost",
    description: "Average improvement",
    icon: Target,
    color: "from-accent-cyan/30 to-accent-cyan/10"
  },
  { 
    value: 3.2, 
    suffix: "x", 
    label: "More Callbacks",
    description: "Interview increase",
    icon: Award,
    color: "from-emerald-500/30 to-emerald-500/10"
  },
];

export const StatsSection = () => {
  return (
    <section id="stats" className="relative px-4 py-20 sm:py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Section header */}
      <div className="mx-auto max-w-7xl text-center">
        <SectionReveal>
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            By the Numbers
          </span>
        </SectionReveal>
        <SectionReveal delay={0.1}>
          <h2 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl">
            <GradientText>Trusted by Thousands</GradientText>
          </h2>
        </SectionReveal>
        <SectionReveal delay={0.2}>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Real results from real job seekers who transformed their career search.
          </p>
        </SectionReveal>
      </div>
      
      {/* Stats grid */}
      <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <SectionReveal key={stat.label} delay={0.1 + i * 0.1}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <GlassCard className="group relative overflow-hidden p-5 sm:p-6 text-center transition-all hover:border-white/20 hover:shadow-glow-sm">
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                
                {/* Content */}
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    className="font-display text-3xl sm:text-4xl md:text-5xl text-gradient"
                  />
                  
                  <p className="mt-2 text-sm font-medium text-foreground">{stat.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </GlassCard>
            </motion.div>
          </SectionReveal>
        ))}
      </div>
    </section>
  );
};
