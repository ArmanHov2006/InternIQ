import { AnimatedCounter } from "@/components/ui/animated-counter";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionReveal } from "@/components/ui/section-reveal";

const stats = [
  { value: 50000, suffix: "+", label: "Applications Tracked" },
  { value: 12000, suffix: "+", label: "Resumes Analyzed" },
  { value: 89, suffix: "%", label: "Average Fit Improvement" },
  { value: 3.2, suffix: "x", label: "More Interview Callbacks" },
];

export const StatsSection = () => {
  return (
    <section id="stats" className="relative px-4 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="mx-auto grid max-w-7xl gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <SectionReveal key={stat.label} delay={i * 0.1}>
            <GlassCard className="p-4 sm:p-6 text-center">
              <AnimatedCounter
                target={stat.value}
                suffix={stat.suffix}
                className="font-display text-2xl sm:text-3xl md:text-4xl text-gradient"
              />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
            </GlassCard>
          </SectionReveal>
        ))}
      </div>
    </section>
  );
};
