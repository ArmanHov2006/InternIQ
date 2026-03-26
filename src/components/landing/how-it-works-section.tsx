"use client";

import { KanbanSquare, Sparkles, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GsapSplitHeading } from "@/components/animations/gsap-split-heading";
import { GsapStaggerReveal } from "@/components/animations/gsap-stagger-reveal";

const sectionBadgeClasses =
  "mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700";

const steps = [
  {
    number: "1",
    icon: KanbanSquare,
    title: "Track Applications",
    description:
      "Organize every internship in a visual pipeline, from first click to final offer.",
  },
  {
    number: "2",
    icon: UserRound,
    title: "Build Your Portfolio",
    description:
      "Create a polished public profile that highlights your projects, skills, and achievements.",
  },
  {
    number: "3",
    icon: Sparkles,
    title: "Stand Out with AI",
    description:
      "Generate better outreach, improve your resume, and focus on the roles you can win.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <GsapStaggerReveal className="text-center">
          <span data-reveal-item className={sectionBadgeClasses}>
            How It Works
          </span>
          <GsapSplitHeading
            text="Three Steps to Internship Success"
            className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl"
          />
          <p data-reveal-item className="mx-auto mt-4 max-w-2xl text-[#6B7280]">
            Build momentum quickly with a focused workflow that keeps your job search clear
            and consistent from day one.
          </p>
        </GsapStaggerReveal>
        <GsapStaggerReveal className="mt-12 grid gap-6 md:grid-cols-3" stagger={0.16}>
          {steps.map((step) => (
            <div key={step.title} data-reveal-item>
              <Card className="rounded-xl border-[#E5E7EB] bg-[#F9FAFB]">
                <CardContent className="p-8">
                  <div className="mb-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#2563EB]">
                    {step.number}
                  </div>
                  <step.icon className="mb-4 h-6 w-6 text-[#2563EB]" />
                  <h3 className="text-xl font-semibold text-[#111827]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6B7280]">{step.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </GsapStaggerReveal>
      </div>
    </section>
  );
};
