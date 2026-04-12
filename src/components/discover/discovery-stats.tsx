"use client";

import { Briefcase, CheckCircle2, ScanSearch, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDiscoveryPrimaryScore, parseStoredAi } from "@/lib/services/discovery/ai-scorer";
import { useDiscoverStore } from "@/stores/discover-store";
import type { Opportunity } from "@/types/database";

interface DiscoveryStatsProps {
  opportunities: Opportunity[];
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: string;
}) => (
  <GlassCard className="flex items-center gap-3 p-4">
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
        accent ?? "bg-primary/10 text-primary"
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </div>
    <div className="min-w-0">
      <p className="truncate font-mono text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </GlassCard>
);

const SOURCE_LABELS: Record<string, string> = {
  adzuna: "Adzuna",
  greenhouse: "Greenhouse",
  themuse: "The Muse",
  jsearch: "JSearch",
  himalayas: "Himalayas",
  jobicy: "Jobicy",
  remoteok: "RemoteOK",
  jooble: "Jooble",
  usajobs: "USAJobs",
  linkedin: "LinkedIn",
};

export const DiscoveryStats = ({ opportunities }: DiscoveryStatsProps) => {
  const latestRunSummary = useDiscoverStore((state) => state.latestRunSummary);
  const activeShortlist = opportunities.filter((opportunity) => opportunity.status === "new");
  const total = activeShortlist.length;
  const applyReadyCount = activeShortlist.filter((opportunity) => {
    const ai = parseStoredAi(opportunity);
    return ai ? ai.verdict === "strong_apply" || ai.verdict === "apply" : false;
  }).length;
  const reviewedCount = latestRunSummary?.reviewedCount ?? 0;
  const avgScore =
    total > 0
      ? Math.round(
          activeShortlist.reduce((sum, opportunity) => sum + (getDiscoveryPrimaryScore(opportunity) ?? 0), 0) / total
        )
      : 0;

  const sourceAvailability = latestRunSummary?.sourceAvailability;
  const sourceStats = latestRunSummary?.diagnostics?.sourceStats;
  const sourceErrors = latestRunSummary?.sourceErrors;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Active discovered"
          value={String(total)}
          icon={Briefcase}
        />
        <StatCard
          label="Apply-ready"
          value={String(applyReadyCount)}
          icon={CheckCircle2}
          accent="bg-teal-500/10 text-teal-400"
        />
        <StatCard
          label="Reviewed last run"
          value={reviewedCount > 0 ? String(reviewedCount) : "--"}
          icon={ScanSearch}
          accent="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="Avg shortlist score"
          value={avgScore > 0 ? `${avgScore}%` : "--"}
          icon={TrendingUp}
          accent="bg-amber-500/10 text-amber-400"
        />
      </div>

      {sourceAvailability ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] text-muted-foreground">Sources:</span>
          {Object.entries(sourceAvailability).map(([source, info]) => {
            const label = SOURCE_LABELS[source] ?? source;
            const stats = sourceStats?.[source];
            const hasError = Boolean(sourceErrors?.[source]);
            const isEnabled = info.enabled;

            let variant: "secondary" | "outline" | "destructive" = "outline";
            let detail = "";
            if (!isEnabled) {
              detail = "Not configured";
            } else if (hasError && (!stats || stats.count === 0)) {
              variant = "destructive";
              detail = "Error";
            } else if (stats) {
              variant = "secondary";
              detail = `${stats.count}${stats.timedOut ? " (slow)" : ""}`;
            }

            return (
              <Badge
                key={source}
                variant={variant}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px]",
                  !isEnabled && "opacity-50"
                )}
                title={!isEnabled ? `Missing: ${info.requiresEnv.join(", ")}` : sourceErrors?.[source] ?? `${stats?.count ?? 0} jobs`}
              >
                {label}
                {detail ? <span className="ml-1 font-mono">{detail}</span> : null}
              </Badge>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
