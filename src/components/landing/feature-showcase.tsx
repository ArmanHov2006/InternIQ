"use client";

import { CheckCircle2 } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { TiltCard } from "@/components/motion/tilt-card";

type Feature = {
  title: string;
  description: string;
  bullets: string[];
  variant: "tracker" | "profile" | "ai";
};

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card dark:bg-gray-900 shadow-2xl">
      <div className="flex h-10 items-center gap-2 border-b border-border/60 bg-muted/40 px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <div className="ml-2 h-6 flex-1 rounded-md border border-border/60 bg-background/80 px-3 text-xs text-muted-foreground">
          app.interniq.com
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TrackerMockup() {
  const cols = [
    {
      label: "Saved",
      cls: "bg-blue-500/10 border-blue-500/25",
      cards: [
        { company: "Stripe", role: "SWE Intern", meta: "San Francisco · Jun" },
        { company: "Vercel", role: "Frontend Intern", meta: "Remote · Jul" },
      ],
    },
    {
      label: "Applied",
      cls: "bg-indigo-500/10 border-indigo-500/25",
      cards: [
        { company: "Linear", role: "Product Eng Intern", meta: "New York · Jun" },
        { company: "Notion", role: "Platform Intern", meta: "Remote · Aug" },
      ],
    },
    {
      label: "Interview",
      cls: "bg-purple-500/10 border-purple-500/25",
      cards: [
        { company: "Figma", role: "Design Eng Intern", meta: "Seattle · 2nd round" },
        { company: "Datadog", role: "Backend Intern", meta: "Boston · Panel" },
      ],
    },
    {
      label: "Offer",
      cls: "bg-green-500/10 border-green-500/25",
      cards: [{ company: "GitHub", role: "Software Intern", meta: "Offer pending sign" }],
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {cols.map((col) => (
        <div key={col.label} className={`rounded-lg border p-2 ${col.cls}`}>
          <p className="mb-2 text-[10px] font-semibold">{col.label}</p>
          <div className="space-y-2">
            {col.cards.map((card) => (
              <div key={card.company} className="rounded-md border border-border bg-card px-2 py-1.5">
                <p className="truncate text-[10px] font-semibold">{card.company}</p>
                <p className="truncate text-[10px] text-muted-foreground">{card.role}</p>
                <p className="truncate text-[9px] text-muted-foreground/80">{card.meta}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileMockup() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
          <div className="flex-1">
            <p className="text-xs font-semibold">Aarav Sharma</p>
            <p className="text-[10px] text-muted-foreground">Computer Science @ UC Berkeley</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <span key={idx} className="h-6 w-6 rounded-full bg-muted" />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {["React", "TypeScript", "PostgreSQL", "Node.js"].map((skill) => (
          <span key={skill} className="rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-medium text-blue-500">
            {skill}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {[
          "Built an internship tracker used by 400+ students.",
          "Shipped a resume parser that reduced profile setup time by 65%.",
        ].map((line) => (
          <div key={line} className="rounded-lg border border-border bg-muted/30 p-2">
            <p className="text-[10px] text-muted-foreground">{line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIMockup() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Draft Outreach
        </p>
        <div className="space-y-1 text-[10px] text-muted-foreground">
          <p className="text-foreground/90">
            Subject: Interested in Product Engineering Intern role at Linear
          </p>
          <p>
            Hi Team - I built internal tooling used by 400+ students and would love to bring that
            product-first mindset to your internship team.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-500/70 text-2xl font-bold text-green-500">
          87
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Strong match", "Portfolio ready", "Add metrics"].map((pill) => (
            <span key={pill} className="rounded-full bg-muted px-2 py-1 text-[10px]">
              {pill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureShowcase({ features }: { features: Feature[] }) {
  return (
    <div className="space-y-14">
      {features.map((feature, idx) => (
        <div key={feature.title} className="grid items-center gap-8 lg:grid-cols-2">
          <FadeIn direction={idx % 2 === 0 ? "left" : "right"}>
            <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
              <p className="mb-3 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">
                Core Feature
              </p>
              <h3 className="text-3xl font-bold tracking-tight">{feature.title}</h3>
              <p className="mt-3 text-muted-foreground">{feature.description}</p>
              <ul className="mt-5 space-y-2">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
          <FadeIn direction={idx % 2 === 0 ? "right" : "left"}>
            <div className={idx % 2 === 1 ? "lg:order-1" : ""}>
              <div className="relative">
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
                <TiltCard className="relative">
                  <BrowserFrame>
                    {feature.variant === "tracker" ? <TrackerMockup /> : null}
                    {feature.variant === "profile" ? <ProfileMockup /> : null}
                    {feature.variant === "ai" ? <AIMockup /> : null}
                  </BrowserFrame>
                </TiltCard>
              </div>
            </div>
          </FadeIn>
        </div>
      ))}
    </div>
  );
}
