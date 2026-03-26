"use client";

import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/magicui/marquee";
import { GsapSplitHeading } from "@/components/animations/gsap-split-heading";
import { GsapStaggerReveal } from "@/components/animations/gsap-stagger-reveal";
import { setupGsap } from "@/components/animations/gsap";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";

const stats = [
  { value: 10000, suffix: "+", label: "Applications Tracked" },
  { value: 2500, suffix: "+", label: "Portfolios Created" },
  { value: 85, suffix: "%", label: "Interview Rate Increase" },
  { value: 500, suffix: "+", label: "Universities" },
];

const testimonials = [
  {
    quote:
      "InternIQ helped me stay consistent with follow-ups and land two interviews in one week.",
    author: "Sarah K., Stanford",
  },
  {
    quote:
      "The public profile and AI email generator made networking feel much easier and faster.",
    author: "James T., MIT",
  },
  {
    quote:
      "I finally had a system. The tracker and fit score removed so much internship stress.",
    author: "Priya M., Columbia",
  },
];

export const SocialProofSection = () => {
  const statsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!statsRef.current || prefersReducedMotion()) {
      return;
    }

    const gsap = setupGsap();
    const statNodes = statsRef.current.querySelectorAll<HTMLElement>("[data-stat-value]");
    const tween = gsap.fromTo(
      statNodes,
      { textContent: 0 },
      {
        textContent: (index: number) => Number(statNodes[index].dataset.statTarget ?? 0),
        duration: 1.2,
        stagger: 0.16,
        ease: "power2.out",
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
        snap: { textContent: 1 },
        onUpdate: () => {
          statNodes.forEach((node) => {
            const value = Number(node.textContent || 0);
            node.textContent = new Intl.NumberFormat("en-US").format(value);
          });
        },
      }
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <section className="bg-[#111827] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <GsapStaggerReveal
          className="grid gap-8 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.12}
        >
          <div ref={statsRef} className="contents">
            {stats.map((stat) => (
              <div key={stat.label} data-reveal-item className="text-center sm:text-left">
                <p className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
                  <span data-stat-value data-stat-target={stat.value} className="tabular-nums">
                    0
                  </span>
                  {stat.suffix}
                </p>
                <p className="mt-2 text-sm font-medium text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </GsapStaggerReveal>

        <div className="mt-12 text-center">
          <GsapSplitHeading
            text="What Students Are Saying"
            className="text-3xl font-bold text-white sm:text-4xl"
          />
        </div>

        <GsapStaggerReveal className="mt-10">
          <Marquee pauseOnHover repeat={3} className="[--duration:55s]">
            {testimonials.map((item) => (
              <Card
                key={item.author}
                data-reveal-item
                className="mx-2 w-[300px] shrink-0 rounded-xl border-white/5 bg-[#1F2937]"
              >
                <CardContent className="p-7">
                  <div className="mb-4 flex items-center gap-1 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={`${item.author}-${index}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm italic leading-6 text-gray-200">{item.quote}</p>
                  <p className="mt-4 text-sm font-semibold text-white">- {item.author}</p>
                </CardContent>
              </Card>
            ))}
          </Marquee>
        </GsapStaggerReveal>
      </div>
    </section>
  );
};
