"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { BorderBeam } from "@/components/magicui/border-beam";
import { setupGsap } from "@/components/animations/gsap";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";
import { ParticlesOverlay } from "@/components/animations/particles-overlay";

const HeroMeshScene = dynamic(() => import("@/components/3d/hero-mesh-scene"), {
  ssr: false,
});

const trustSchools = ["Stanford", "MIT", "Harvard", "Berkeley", "Columbia"];
const headlineWords = ["Land", "Your", "Dream", "Internship,", "Organized"];

export const HeroSection = () => {
  const headlineRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (!headlineRef.current || prefersReducedMotion()) {
      return;
    }

    const gsap = setupGsap();
    const words = headlineRef.current.querySelectorAll("[data-hero-word]");
    const tween = gsap.fromTo(
      words,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.12,
      }
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F0F5FF] to-white px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <HeroMeshScene />
      </div>
      <ParticlesOverlay />
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center relative z-10">
        <BlurFade delay={0.05} inView>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-[#2563EB]">
            <Sparkles className="h-4 w-4" />
            <AnimatedShinyText className="text-[#2563EB]">
              The #1 Platform for Intern Job Seekers
            </AnimatedShinyText>
          </div>
        </BlurFade>
        <h1
          ref={headlineRef}
          className="max-w-4xl text-center text-4xl font-bold leading-tight tracking-tight text-[#111827] sm:text-5xl lg:text-6xl"
        >
          {headlineWords.map((word) => (
            <span
              key={word}
              data-hero-word
              className="inline-block translate-y-10 px-[0.24em] opacity-0"
            >
              {word}
            </span>
          ))}
        </h1>

        <BlurFade delay={0.3} inView>
          <p className="mt-6 max-w-3xl text-center text-base text-[#6B7280] sm:text-lg lg:text-xl">
            Track applications, build your portfolio, and stand out with AI-powered tools
            all in one place designed for ambitious students.
          </p>
        </BlurFade>

        <BlurFade delay={0.4} inView>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-[#2563EB] px-7 text-white shadow-lg hover:bg-[#1D4ED8] sm:w-auto"
            >
              <Link
                href="/signup"
                className="inline-flex items-center gap-2"
                data-cursor="cta"
                data-cursor-label="Start"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border-[#D1D5DB] bg-white px-7 text-[#111827] hover:bg-[#F9FAFB] sm:w-auto"
            >
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2"
                data-cursor="interactive"
              >
                <PlayCircle className="h-4 w-4 text-[#2563EB]" />
                See How It Works
              </a>
            </Button>
          </div>
        </BlurFade>

        <BlurFade delay={0.5} inView className="w-full">
          <div className="relative mt-12 w-full max-w-5xl rounded-2xl border border-[#E5E7EB] bg-[#F3F4F6] p-4 shadow-xl sm:p-6 lg:mt-14">
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-white sm:min-h-[360px] lg:min-h-[520px]">
              <p className="text-sm font-medium text-[#9CA3AF]">Product preview</p>
            </div>
            <BorderBeam duration={8} size={84} colorFrom="#3b82f6" colorTo="#7c3aed" />
          </div>
        </BlurFade>

        <BlurFade
          delay={0.6}
          inView
          className="mt-10 flex w-full flex-col items-center gap-3 border-t border-[#E5E7EB] pt-8 text-sm text-[#9CA3AF] sm:flex-row sm:justify-center sm:gap-4"
        >
          <span className="font-semibold text-[#6B7280]">Trusted by students at</span>
          {trustSchools.map((school) => (
            <span key={school} className="font-medium">
              {school}
            </span>
          ))}
        </BlurFade>
      </div>
    </section>
  );
};
