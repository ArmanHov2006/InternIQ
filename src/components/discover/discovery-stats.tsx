"use client";

import { Briefcase, Inbox, PlusCircle, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
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

export const DiscoveryStats = ({ opportunities }: DiscoveryStatsProps) => {
  const total = opportunities.length;
  const newCount = opportunities.filter((o) => o.status === "new").length;
  const savedCount = opportunities.filter((o) => o.application_id).length;
  const avgScore =
    total > 0
      ? Math.round(
          opportunities.reduce((sum, o) => sum + (o.match_score ?? 0), 0) / total
        )
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total discovered"
        value={String(total)}
        icon={Briefcase}
      />
      <StatCard
        label="New matches"
        value={String(newCount)}
        icon={Inbox}
        accent="bg-blue-500/10 text-blue-400"
      />
      <StatCard
        label="Saved to pipeline"
        value={String(savedCount)}
        icon={PlusCircle}
        accent="bg-emerald-500/10 text-emerald-400"
      />
      <StatCard
        label="Avg match score"
        value={avgScore > 0 ? `${avgScore}%` : "--"}
        icon={TrendingUp}
        accent="bg-amber-500/10 text-amber-400"
      />
    </div>
  );
};
