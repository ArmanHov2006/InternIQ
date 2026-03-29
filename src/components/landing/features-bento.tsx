import { BentoCard } from "@/components/ui/bento-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Activity, Bot, Mail, UserRound } from "lucide-react";

export const FeaturesBento = () => {
  return (
    <section id="features" className="relative px-4 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="mx-auto grid max-w-7xl gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SectionReveal className="lg:col-span-2 lg:row-span-2">
          <BentoCard className="h-full transition hover:scale-[1.01] hover:shadow-glow-md" colSpan={2} rowSpan={2}>
            <h3 className="text-xl font-semibold md:text-2xl">Interactive Mini Tracker</h3>
            <p className="mt-2 text-sm text-muted-foreground">Drag cards across columns to feel the workflow.</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <p className="ml-2 text-xs text-muted-foreground">interniq.app/tracker-preview</p>
              </div>
              <div className="[transform:perspective(1000px)_rotateX(4deg)]">
                <InteractiveDemo />
              </div>
            </div>
          </BentoCard>
        </SectionReveal>

        <SectionReveal className="lg:col-span-2">
          <BentoCard colSpan={2} className="transition hover:scale-[1.01] hover:shadow-glow-md">
            <div className="mb-3 inline-flex rounded-lg border border-white/10 bg-white/5 p-2">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">AI Resume Analysis</h3>
            <p className="mt-2 text-sm text-muted-foreground">Typed recommendations, fit scoring, and action items.</p>
          </BentoCard>
        </SectionReveal>

        <SectionReveal>
          <BentoCard className="transition hover:scale-[1.01] hover:shadow-glow-sm">
            <p className="text-sm text-muted-foreground">Applications tracked</p>
            <AnimatedCounter target={50000} suffix="+" className="mt-2 text-3xl font-display text-gradient" />
          </BentoCard>
        </SectionReveal>

        <SectionReveal>
          <BentoCard className="transition hover:scale-[1.01] hover:shadow-glow-sm">
            <div className="mb-3 inline-flex rounded-lg border border-white/10 bg-white/5 p-2">
              <Mail className="h-4 w-4 text-accent-cyan" />
            </div>
            <h3 className="text-lg font-semibold">Cold Email Generator</h3>
            <p className="mt-2 text-sm text-muted-foreground">Personalized outreach in seconds.</p>
          </BentoCard>
        </SectionReveal>

        <SectionReveal className="lg:row-span-2">
          <BentoCard rowSpan={2} className="h-full transition hover:scale-[1.01] hover:shadow-glow-md">
            <div className="mb-3 inline-flex rounded-lg border border-white/10 bg-white/5 p-2">
              <UserRound className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Public Profile</h3>
            <p className="mt-2 text-sm text-muted-foreground">Shareable portfolio with projects and skills.</p>
          </BentoCard>
        </SectionReveal>

        <SectionReveal>
          <BentoCard className="transition hover:scale-[1.01] hover:shadow-glow-sm">
            <div className="mb-3 inline-flex rounded-lg border border-white/10 bg-white/5 p-2">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Analytics</h3>
            <div className="mt-4 h-10 rounded-full bg-gradient-to-r from-primary via-accent to-accent-cyan opacity-70" />
          </BentoCard>
        </SectionReveal>
      </div>
    </section>
  );
};
