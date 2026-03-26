"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { ParallaxLayer } from "@/components/animations/ParallaxLayer";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { TextReveal } from "@/components/animations/TextReveal";
import { StaggerChildren, StaggerItem } from "@/components/animations/StaggerChildren";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  AIToolsMockup,
  BrowserFrame,
  KanbanMockup,
  ProfileMockup,
} from "@/components/landing/ProductMockup";

const rows = [
  {
    badge: "APPLICATION TRACKER",
    title: "Your Job Search Command Center",
    description:
      "Visualize your entire job search on an intuitive Kanban board. Drag applications between stages, track deadlines, and never lose an opportunity.",
    highlight: "Operate your pipeline with zero chaos.",
    metricValue: "6",
    metricLabel: "stages tracked",
    bullets: [
      "Drag & drop between stages",
      "Track company, role, and status",
      "Filter and search applications",
    ],
  },
  {
    badge: "PUBLIC PORTFOLIO",
    title: "Your Professional Identity, Online",
    description:
      "Get a beautiful, SEO-optimized profile page at your own URL. Showcase your education, experience, projects, and skills — shareable with any recruiter.",
    highlight: "One link that sells your story instantly.",
    metricValue: "1",
    metricLabel: "shareable URL",
    bullets: [
      "Custom URL (interniq.com/yourname)",
      "Server-rendered for SEO",
      "Automatic OpenGraph metadata",
    ],
  },
  {
    badge: "AI-POWERED TOOLS",
    title: "Let AI Give You the Edge",
    description:
      "Generate personalized cold outreach emails, get your resume analyzed with actionable feedback, and see fit scores for every role.",
    highlight: "Target high-fit roles and move faster.",
    metricValue: "3",
    metricLabel: "AI copilots",
    bullets: [
      "AI cold email generator",
      "Resume analysis & parsing",
      "Role fit scoring",
    ],
  },
];

const featureMockups = {
  "APPLICATION TRACKER": (
    <BrowserFrame url="interniq.com/dashboard">
      <KanbanMockup variant="feature" />
    </BrowserFrame>
  ),
  "PUBLIC PORTFOLIO": (
    <BrowserFrame url="interniq.com/sarahk">
      <ProfileMockup />
    </BrowserFrame>
  ),
  "AI-POWERED TOOLS": (
    <BrowserFrame url="interniq.com/dashboard/email">
      <AIToolsMockup />
    </BrowserFrame>
  ),
} as const;

const InteractiveMockup = ({
  children,
  emphasis = false,
}: {
  children: React.ReactNode;
  emphasis?: boolean;
}) => {
  const reducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const tiltStrength = emphasis ? 9 : 6;
  const shiftStrengthX = emphasis ? 16 : 10;
  const shiftStrengthY = emphasis ? 13 : 8;
  const baseScale = emphasis ? 1.02 : 1.015;
  const maxScale = emphasis ? 1.08 : 1.05;

  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [tiltStrength, -tiltStrength]), {
    stiffness: 180,
    damping: 18,
    mass: 0.4,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-tiltStrength, tiltStrength]), {
    stiffness: 180,
    damping: 18,
    mass: 0.4,
  });
  const shiftX = useSpring(useTransform(pointerX, [-0.5, 0.5], [-shiftStrengthX, shiftStrengthX]), {
    stiffness: 180,
    damping: 18,
    mass: 0.4,
  });
  const shiftY = useSpring(useTransform(pointerY, [-0.5, 0.5], [-shiftStrengthY, shiftStrengthY]), {
    stiffness: 180,
    damping: 18,
    mass: 0.4,
  });
  const hoverScale = useSpring(useTransform(pointerY, [-0.5, 0.5], [baseScale, maxScale]), {
    stiffness: 180,
    damping: 18,
    mass: 0.4,
  });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(Math.max(-0.5, Math.min(0.5, x)));
    pointerY.set(Math.max(-0.5, Math.min(0.5, y)));
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
    setIsHovering(false);
  };

  return (
    <div className="group relative [perspective:1200px]" ref={wrapperRef}>
      <motion.div
        onPointerEnter={() => setIsHovering(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        style={
          reducedMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                x: shiftX,
                y: shiftY,
                scale: hoverScale,
                transformStyle: "preserve-3d",
              }
        }
      >
        <div className="relative">
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            animate={{
              opacity: isHovering ? (emphasis ? 1 : 0.85) : 0,
            }}
            style={{
              background: emphasis
                ? "radial-gradient(600px circle at 50% 70%, rgba(59,130,246,0.17), transparent 55%)"
                : "radial-gradient(460px circle at 50% 70%, rgba(59,130,246,0.12), transparent 58%)",
            }}
            transition={{ duration: 0.18 }}
          />
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const CoreFeatures = () => {
  return (
    <section id="features" className="relative overflow-hidden bg-muted/30 px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[8%] h-44 w-44 rounded-full bg-blue-100/60 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute bottom-[12%] right-[8%] h-56 w-56 rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-12">
        {rows.map((row, index) => {
          const reversed = index % 2 === 1;
          return (
            <div key={row.title} className="rounded-3xl border border-border bg-card/90 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:shadow-[0_24px_70px_-42px_rgba(0,0,0,0.7)] sm:p-8 lg:p-10">
              <div className="grid items-center gap-10 lg:grid-cols-2">
                <div className={reversed ? "order-2 lg:order-2" : "order-2"}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {row.badge}
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300">
                      {index + 1}
                    </span>
                  </div>
                  <TextReveal
                    text={row.title}
                    as="h3"
                    splitBy="words"
                    className="text-4xl font-bold tracking-[-0.02em] leading-[1.1] text-foreground sm:text-5xl lg:text-[56px]"
                  />
                  <ScrollReveal direction={reversed ? "right" : "left"} className="mt-5 text-muted-foreground">
                    {row.description}
                  </ScrollReveal>

                  <ScrollReveal delay={0.08} className="mt-5 inline-flex items-center rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-sm font-medium text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300">
                    {row.highlight}
                  </ScrollReveal>

                  <div className="mt-6 flex items-end gap-3 border-l-2 border-blue-200 pl-4 dark:border-blue-500/40">
                    <p className="text-3xl font-bold tracking-tight text-foreground">{row.metricValue}x</p>
                    <p className="pb-1 text-xs uppercase tracking-wider text-muted-foreground">{row.metricLabel}</p>
                  </div>

                  <StaggerChildren className="mt-8 space-y-3" staggerDelay={0.08}>
                    {row.bullets.map((bullet) => (
                      <StaggerItem key={bullet} className="flex items-center gap-3 text-sm text-foreground/80">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
                          <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                        </span>
                        {bullet}
                      </StaggerItem>
                    ))}
                  </StaggerChildren>
                </div>

                <div className={reversed ? "order-1 lg:order-1" : "order-1"}>
                  <ParallaxLayer speed={-0.15}>
                    <ScrollReveal delay={0.1}>
                      <InteractiveMockup emphasis={index === 0}>
                        <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-muted/30 p-2 shadow-[0_25px_40px_-24px_rgba(30,58,95,0.35)] dark:shadow-[0_25px_40px_-22px_rgba(0,0,0,0.65)]">
                          {featureMockups[row.badge as keyof typeof featureMockups]}
                        </div>
                      </InteractiveMockup>
                    </ScrollReveal>
                  </ParallaxLayer>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
