"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, PlayCircle, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { TextReveal } from "@/components/motion/text-reveal";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { SplineAccent } from "@/components/landing/spline-hero";
import { WorkflowCinematic } from "@/components/landing/workflow-cinematic";

type HeroCinematicProps = {
  sceneUrl: string;
  navLinks: Array<{ href: string; label: string }>;
  trustSchools: string[];
};

export function HeroCinematic({ sceneUrl, navLinks, trustSchools }: HeroCinematicProps) {
  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/40 bg-background/65 backdrop-blur-2xl">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-500">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            InternIQ
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <MagneticButton key={link.href} strength={0.18}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              </MagneticButton>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Log In
            </Link>
            <MagneticButton>
              <Button asChild className="rounded-full bg-blue-600 px-5 text-white shadow-lg shadow-blue-600/25">
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </MagneticButton>
          </div>
        </nav>
      </header>

      <section className="hero-shell relative overflow-hidden px-4 pb-12 pt-24 sm:px-6 lg:px-8 lg:pb-16 lg:pt-28">
        <div className="hero-vignette absolute inset-0 -z-20" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.2),transparent_56%)]" />
        <SplineAccent sceneUrl={sceneUrl} />

        <div className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-7xl content-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] xl:gap-14">
          <div className="relative z-10 max-w-2xl">
            <FadeIn delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">
                <Sparkles className="h-3.5 w-3.5" />
                The #1 Platform for Intern Job Seekers
              </span>
            </FadeIn>

            <TextReveal
              text="Land Your Dream Internship, Organized"
              tag="h1"
              delay={0.18}
              className="mt-6 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            />

            <FadeIn delay={0.55}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Track applications, optimize your positioning, and ship AI-powered outreach in one precise workflow built for ambitious students.
              </p>
            </FadeIn>

            <FadeIn delay={0.72}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <MagneticButton>
                  <Button asChild size="lg" className="rounded-full bg-blue-600 px-8 text-white shadow-2xl shadow-blue-600/30">
                    <Link href="/signup" className="inline-flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </MagneticButton>
                <MagneticButton>
                  <Button asChild size="lg" variant="outline" className="rounded-full border-border/60 px-8">
                    <a href="#how-it-works" className="inline-flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-blue-500" />
                      See How It Works
                    </a>
                  </Button>
                </MagneticButton>
              </div>
            </FadeIn>

            <FadeIn delay={0.95}>
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border/50 pt-6 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/85">Trusted by students at</span>
                {trustSchools.map((school) => (
                  <span key={school} className="font-medium text-muted-foreground/80">
                    {school}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.45} direction="left" className="relative z-10 mx-auto w-full max-w-2xl lg:max-w-none lg:self-center">
            <WorkflowCinematic />
          </FadeIn>
        </div>
      </section>
    </>
  );
}
