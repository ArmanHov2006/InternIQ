"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import type { AnalysisRecord } from "@/types/local-features";
import { GlassCard } from "@/components/ui/glass-card";

type LocalResumeAnalysisResultProps = {
  analysis: AnalysisRecord;
};

const scoreColor = (score: number): string => {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-rose-400";
};

const scoreStroke = (score: number): string => {
  if (score >= 75) return "#34d399";
  if (score >= 50) return "#facc15";
  return "#fb7185";
};

function AnimatedRing({ score }: { score: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.max(0, Math.min(100, score));
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative h-40 w-40">
      <svg className="h-40 w-40 -rotate-90" viewBox="0 0 140 140" aria-hidden>
        <circle cx="70" cy="70" r={radius} strokeWidth="12" className="fill-none stroke-white/10" />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          strokeWidth="12"
          strokeLinecap="round"
          className="fill-none"
          stroke={scoreStroke(normalized)}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.p
            key={normalized}
            className={`text-4xl font-bold ${scoreColor(normalized)}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            {normalized}
          </motion.p>
          <p className="text-xs text-muted-foreground">Fit Score</p>
        </div>
      </div>
    </div>
  );
}

function ListSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
}) {
  return (
    <GlassCard className="p-4" tiltEnabled={false}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      ) : (
        <ul className="space-y-2 text-sm text-foreground/90">
          {items.map((item) => (
            <li key={item} className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
              {item}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

export function LocalResumeAnalysisResult({ analysis }: LocalResumeAnalysisResultProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="p-5" tiltEnabled={false}>
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <div className="mx-auto md:mx-0">
            <AnimatedRing score={analysis.fitScore} />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Analysis Highlights</p>
            <ul className="space-y-2">
              {analysis.highlights.map((highlight) => (
                <li key={highlight} className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2 text-sm">
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListSection
          title="Missing Keywords"
          icon={<AlertTriangle className="h-4 w-4 text-rose-300" />}
          items={analysis.missingKeywords}
        />
        <ListSection
          title="Matched Keywords"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />}
          items={analysis.matchedKeywords}
        />
      </div>

      <ListSection
        title="Suggestions"
        icon={<Lightbulb className="h-4 w-4 text-yellow-300" />}
        items={analysis.suggestions}
      />
    </motion.div>
  );
}
