"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GsapSplitHeading } from "@/components/animations/gsap-split-heading";
import { GsapStaggerReveal } from "@/components/animations/gsap-stagger-reveal";

export const FinalCtaSection = () => {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-[#F9FAFB] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <GsapStaggerReveal className="mx-auto w-full max-w-4xl text-center">
        <GsapSplitHeading
          text="Ready to Take Control of Your Internship Search?"
          className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl lg:text-5xl"
        />
        <p data-reveal-item className="mx-auto mt-5 max-w-2xl text-[#6B7280]">
            Join thousands of students using InternIQ to stay organized and land better
            opportunities faster.
        </p>
        <Button
          asChild
          size="lg"
          data-reveal-item
          className="mt-9 rounded-full bg-[#2563EB] px-8 text-white shadow-lg hover:bg-[#1D4ED8]"
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2"
            data-cursor="cta"
            data-cursor-label="Join"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <p data-reveal-item className="mt-5 text-xs font-medium text-[#6B7280] sm:text-sm">
          No credit card required · Free forever for students · Setup in 30 seconds
        </p>
      </GsapStaggerReveal>
    </section>
  );
};
