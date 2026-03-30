"use client";

import { useEffect, useMemo, useState } from "react";
import type { Application } from "@/types/database";
import { GlassCard } from "@/components/ui/glass-card";

const pipelineOrder: Application["status"][] = ["saved", "applied", "interview", "offer", "rejected"];

function funnelConversion(apps: Application[]) {
  const total = apps.length;
  if (total === 0) return pipelineOrder.map((s) => ({ status: s, count: 0, pctOfTotal: 0 }));
  const counts = pipelineOrder.reduce(
    (acc, s) => {
      acc[s] = apps.filter((a) => a.status === s).length;
      return acc;
    },
    {} as Record<Application["status"], number>
  );
  return pipelineOrder.map((status) => {
    const count = counts[status];
    const pctOfTotal = Math.round((count / total) * 100);
    return { status, count, pctOfTotal };
  });
}

/** Apps created per week for last 8 weeks */
function weeklyVelocity(apps: Application[]) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: 8 }, () => 0);
  for (const app of apps) {
    const t = new Date(app.created_at).getTime();
    const weeksAgo = Math.floor((now - t) / weekMs);
    if (weeksAgo >= 0 && weeksAgo < 8) {
      buckets[7 - weeksAgo] += 1;
    }
  }
  return buckets;
}

export default function InsightsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/applications", { credentials: "same-origin", headers: { Accept: "application/json" } });
        if (res.ok) setApplications((await res.json()) as Application[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const funnel = useMemo(() => funnelConversion(applications), [applications]);
  const velocity = useMemo(() => weeklyVelocity(applications), [applications]);
  const maxVel = useMemo(() => Math.max(1, ...velocity), [velocity]);

  const responseRate = useMemo(() => {
    const total = applications.length;
    if (total === 0) return 0;
    const pastSaved = applications.filter((a) => a.status !== "saved").length;
    return Math.round((pastSaved / total) * 100);
  }, [applications]);

  const avgDaysSinceUpdate = useMemo(() => {
    if (applications.length === 0) return 0;
    const now = Date.now();
    const sum = applications.reduce((acc, a) => acc + (now - new Date(a.updated_at).getTime()), 0);
    return Math.round(sum / applications.length / (24 * 60 * 60 * 1000));
  }, [applications]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">Read-only analytics from your pipeline</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : applications.length === 0 ? (
        <GlassCard className="p-6">
          <p className="text-sm text-muted-foreground">Add applications to see insights.</p>
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="mt-1 text-2xl font-semibold">{applications.length}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Response rate</p>
              <p className="mt-1 text-2xl font-semibold">{responseRate}%</p>
              <p className="text-xs text-muted-foreground">Past &quot;saved&quot; stage</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg. days since update</p>
              <p className="mt-1 text-2xl font-semibold">{avgDaysSinceUpdate}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">This week (new)</p>
              <p className="mt-1 text-2xl font-semibold">{velocity[7] ?? 0}</p>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">Stage funnel</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Count and share of all applications</p>
            <div className="mt-4 space-y-3">
              {funnel.map((row) => (
                <div key={row.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{row.status.replace("_", " ")}</span>
                    <span className="text-muted-foreground">
                      {row.count} ({row.pctOfTotal}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full bg-primary/70 transition-all"
                      style={{ width: `${row.pctOfTotal}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">Application velocity</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">New applications per week (last 8 weeks)</p>
            <div className="mt-4 flex h-32 items-end gap-1">
              {velocity.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full max-w-[40px] rounded-t bg-primary/60"
                    style={{ height: `${(v / maxVel) * 100}%`, minHeight: v > 0 ? 4 : 0 }}
                    title={`${v} apps`}
                  />
                  <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">Time in view</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Last update is a rough proxy for recent activity (full time-in-stage requires status history).
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Average days since last update across all cards: <strong className="text-foreground">{avgDaysSinceUpdate}</strong>
            </p>
          </GlassCard>
        </>
      )}
    </div>
  );
}
