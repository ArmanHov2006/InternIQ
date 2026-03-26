"use client";

import { FileUp, GripVertical, Moon, Search, ShieldCheck, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GsapSplitHeading } from "@/components/animations/gsap-split-heading";
import { GsapStaggerReveal } from "@/components/animations/gsap-stagger-reveal";

const sectionBadgeClasses =
  "mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700";

const secondaryFeatures = [
  {
    title: "Drag & Drop",
    description: "Quickly update application stages with a clean, intuitive Kanban workflow.",
    icon: GripVertical,
  },
  {
    title: "Dark Mode",
    description: "Stay productive day or night with a theme that fits your environment.",
    icon: Moon,
  },
  {
    title: "Resume Upload",
    description: "Upload a PDF once and auto-populate profile fields with smart parsing.",
    icon: FileUp,
  },
  {
    title: "Fit Scoring",
    description: "Match job descriptions against your background to focus your energy better.",
    icon: Target,
  },
  {
    title: "SEO-Optimized Profile",
    description: "Get discovered by recruiters through fast, indexable public profile pages.",
    icon: Search,
  },
  {
    title: "Secure by Default",
    description: "Built with strong privacy controls and row-level access protections.",
    icon: ShieldCheck,
  },
];

export const SecondaryFeaturesSection = () => {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <GsapStaggerReveal className="text-center">
          <span data-reveal-item className={sectionBadgeClasses}>
            Everything You Need
          </span>
          <GsapSplitHeading
            text="Built for the Modern Job Seeker"
            className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl"
          />
        </GsapStaggerReveal>
        <GsapStaggerReveal className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
          {secondaryFeatures.map((feature) => (
            <div key={feature.title} data-reveal-item>
              <Card className="rounded-xl border-[#E5E7EB] bg-[#F9FAFB]">
                <CardContent className="p-7">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                    <feature.icon className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#111827]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6B7280]">{feature.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </GsapStaggerReveal>
      </div>
    </section>
  );
};
