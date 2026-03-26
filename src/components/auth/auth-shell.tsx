"use client";

import Link from "next/link";
import { BriefcaseBusiness, ShieldCheck, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

type AuthShellProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  ctaText: string;
  children: React.ReactNode;
};

const highlights = [
  "Track every application with zero clutter.",
  "Get AI-assisted insights and cleaner outreach.",
  "Keep your profile recruiter-ready in one place.",
];

export function AuthShell({
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaText,
  children,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[12%] top-[8%] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[8%] right-[10%] h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.05fr_1fr]">
        <FadeIn className="hidden rounded-2xl border border-border/60 bg-card/35 p-8 backdrop-blur-xl lg:block">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-500">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            InternIQ
          </Link>

          <h1 className="mt-8 max-w-md text-4xl font-black leading-tight tracking-tight text-foreground">
            Land internships with precision, not chaos.
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            The operating system for ambitious students who want focus, consistency, and results.
          </p>

          <div className="mt-8 space-y-3">
            {highlights.map((highlight) => (
              <div key={highlight} className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 text-blue-500" />
                <p className="text-sm text-muted-foreground">{highlight}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Secure auth and private-by-default data access.
          </div>
        </FadeIn>

        <FadeIn className="w-full rounded-2xl border border-border/60 bg-card/45 p-5 backdrop-blur-xl sm:p-7">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-tight lg:hidden">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-500">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            InternIQ
          </Link>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>

          <div className="mt-6">{children}</div>

          <p className="mt-5 text-sm text-muted-foreground">
            {ctaLabel}{" "}
            <Link href={ctaHref} className="font-semibold text-primary transition-colors hover:text-primary/80">
              {ctaText}
            </Link>
          </p>
        </FadeIn>
      </div>
    </div>
  );
}
