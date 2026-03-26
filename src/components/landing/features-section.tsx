"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { setupGsap, ScrollTrigger } from "@/components/animations/gsap";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";
import { GsapStaggerReveal } from "@/components/animations/gsap-stagger-reveal";

const FeatureRevealScene = dynamic(
  () => import("@/components/3d/feature-reveal-scene"),
  { ssr: false }
);

const sectionBadgeClasses =
  "mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700";

const featureRows = [
  {
    badge: "APPLICATION TRACKER",
    title: "Your Job Search Command Center",
    description:
      "Move opportunities through a drag-and-drop Kanban board, set follow-up reminders, and keep every status update in one place.",
  },
  {
    badge: "PUBLIC PORTFOLIO",
    title: "Your Professional Identity, Online",
    description:
      "Launch an SEO-friendly profile page recruiters can discover, with your projects, skills, and experience ready to share.",
  },
  {
    badge: "AI-POWERED TOOLS",
    title: "Let AI Give You the Edge",
    description:
      "Write cold emails faster, get resume feedback instantly, and use fit scoring to prioritize high-match applications.",
  },
];

export const FeaturesSection = () => {
  const pinnedRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!pinnedRef.current || prefersReducedMotion()) {
      return;
    }

    const gsap = setupGsap();
    const trigger = ScrollTrigger.create({
      trigger: pinnedRef.current,
      start: "top top",
      end: "+=250%",
      pin: true,
      scrub: 1.5,
      onUpdate: ({ progress: triggerProgress }) => {
        setProgress(triggerProgress);
      },
    });

    const fadeTween = gsap.fromTo(
      pinnedRef.current.querySelectorAll("[data-feature-copy]"),
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
      }
    );

    return () => {
      trigger.kill();
      fadeTween.kill();
    };
  }, []);

  return (
    <section id="features" className="bg-[#F9FAFB] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 lg:gap-20">
        <div ref={pinnedRef} className="relative h-[250vh]">
          <div className="sticky top-0 flex h-screen items-center">
            <div className="grid w-full items-center gap-8 lg:grid-cols-2">
              <div className="relative h-[55vh] overflow-hidden rounded-2xl border border-[#DBE4F3] bg-[#EAF1FF]">
                <FeatureRevealScene progress={progress} />
              </div>
              <div className="space-y-4">
                <span
                  data-feature-copy
                  className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700"
                >
                  Scroll-Scrubbed 3D Reveal
                </span>
                <h3
                  data-feature-copy
                  className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl"
                >
                  Experience a physical, cinematic feature walkthrough
                </h3>
                <p data-feature-copy className="max-w-xl text-base leading-7 text-[#6B7280] sm:text-lg">
                  As you scroll, a 3D job-search object rises into frame, rotates toward you,
                  and settles into focus while directional lights choreograph the moment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {featureRows.map((feature, index) => {
          const imageFirst = index % 2 !== 0;

          return (
            <GsapStaggerReveal
              key={feature.title}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
            >
              <div
                data-reveal-item
                className={imageFirst ? "order-2 lg:order-1" : "order-2"}
              >
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#E5E7EB] p-6 sm:min-h-[300px]">
                  <span className="text-sm font-medium text-[#9CA3AF]">Feature screenshot</span>
                </div>
              </div>
              <div data-reveal-item className={imageFirst ? "order-1 lg:order-2" : "order-1"}>
                <span className={sectionBadgeClasses} data-reveal-item>
                  {feature.badge}
                </span>
                <h3
                  className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl"
                  data-reveal-item
                >
                  {feature.title}
                </h3>
                <p
                  className="mt-4 max-w-xl text-base leading-7 text-[#6B7280] sm:text-lg"
                  data-reveal-item
                >
                  {feature.description}
                </p>
              </div>
            </GsapStaggerReveal>
          );
        })}
      </div>
    </section>
  );
};
