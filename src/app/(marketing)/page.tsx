import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { LogosSection } from "@/components/landing/logos-section";
import { FeaturesBento } from "@/components/landing/features-bento";
import { StatsSection } from "@/components/landing/stats-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CtaSection } from "@/components/landing/cta-section";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function MarketingPage() {
  return (
    <main id="main-content">
      <HeroSection />
      <LogosSection />
      <FeaturesBento />
      <StatsSection />
      <TestimonialsSection />
      <CtaSection />
    </main>
  );
}
