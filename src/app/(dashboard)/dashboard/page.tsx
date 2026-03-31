"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import type { Application } from "@/types/database";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/dashboard/stat-card-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";

const pipelineStatuses: Application["status"][] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];

const pipelineColors: Record<Application["status"], string> = {
  saved: "bg-[var(--status-saved)]",
  applied: "bg-[var(--status-applied)]",
  interview: "bg-[var(--status-interview)]",
  offer: "bg-[var(--status-offer)]",
  rejected: "bg-[var(--status-rejected)]",
};

/** Last 6 weeks counts of created applications */
function weeklyCreationTrend(apps: Application[]): { value: number }[] {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: 6 }, () => 0);
  for (const app of apps) {
    const t = new Date(app.created_at).getTime();
    const weeksAgo = Math.floor((now - t) / weekMs);
    if (weeksAgo >= 0 && weeksAgo < 6) {
      buckets[5 - weeksAgo] += 1;
    }
  }
  return buckets.map((value) => ({ value }));
}

type SuggestionRow = {
  id: string;
  application_id: string;
  status: string;
  reason?: string;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const [appRes, sugRes] = await Promise.all([
          fetch("/api/applications", { credentials: "same-origin", headers: { Accept: "application/json" } }),
          fetch("/api/automation/status-suggestions", { credentials: "same-origin", headers: { Accept: "application/json" } }).catch(
            () => null
          ),
        ]);
        if (appRes.ok) {
          const data = (await appRes.json()) as Application[];
          setApplications(data);
        }
        if (sugRes?.ok) {
          const payload = (await sugRes.json()) as SuggestionRow[] | { error?: string };
          setSuggestions(Array.isArray(payload) ? payload : []);
        }
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const metrics = useMemo(() => {
    const total = applications.length;
    const byStatus = pipelineStatuses.reduce(
      (acc, status) => {
        acc[status] = applications.filter((a) => a.status === status).length;
        return acc;
      },
      {} as Record<Application["status"], number>
    );
    const activeInterviews = byStatus.interview;
    const offers = byStatus.offer;
    const responded = total - byStatus.saved;
    const responseRate = total === 0 ? 0 : Math.round((responded / total) * 100);
    return { total, byStatus, activeInterviews, offers, responseRate };
  }, [applications]);

  const trend = useMemo(() => weeklyCreationTrend(applications), [applications]);

  const needsAttention = useMemo(() => {
    const items: { id: string; label: string; href: string }[] = [];
    const pending = suggestions.filter((s) => s.status === "pending");
    for (const s of pending.slice(0, 3)) {
      items.push({
        id: `sug-${s.id}`,
        label: "Review Gmail status suggestion",
        href: `/dashboard/settings?section=integrations`,
      });
    }
    const interviewApps = applications.filter((a) => a.status === "interview");
    const interviewNoPrep = interviewApps.filter((a) => {
      const meta = a.ai_metadata;
      const hasPrep =
        meta &&
        typeof meta === "object" &&
        "interviewPrep" in meta &&
        meta.interviewPrep &&
        typeof meta.interviewPrep === "object" &&
        Array.isArray((meta.interviewPrep as { questions?: unknown }).questions) &&
        (meta.interviewPrep as { questions: unknown[] }).questions.length > 0;
      return !hasPrep;
    });
    for (const a of interviewNoPrep) {
      if (items.length >= 3) break;
      items.push({
        id: `prep-${a.id}`,
        label: `${a.company} — interview stage, no prep generated`,
        href: `/dashboard/pipeline?app=${a.id}`,
      });
    }
    const staleSaved = applications.filter((a) => {
      if (a.status !== "saved") return false;
      const created = new Date(a.created_at).getTime();
      return Date.now() - created > 7 * 24 * 60 * 60 * 1000;
    });
    for (const a of staleSaved) {
      if (items.length >= 3) break;
      items.push({
        id: `stale-${a.id}`,
        label: `${a.company} — saved over 7 days`,
        href: `/dashboard/pipeline?app=${a.id}`,
      });
    }
    return items.slice(0, 3);
  }, [applications, suggestions]);

  const recentActivity = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6);
  }, [applications]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pipeline health and recent activity</p>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard label="Total applications" value={metrics.total} trend="All stages" data={trend} />
          <StatCard
            label="Active interviews"
            value={metrics.activeInterviews}
            trend="In interview stage"
            data={trend}
          />
          <StatCard
            label="Response rate"
            value={metrics.responseRate}
            suffix="%"
            trend="Past saved stage"
            data={trend}
          />
          <StatCard label="Offers" value={metrics.offers} trend={metrics.offers > 0 ? "Offers received" : "None yet"} data={trend} />
        </div>
      )}

      {applications.length === 0 && !loading ? (
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title="No applications yet"
          description="Add an application to see analytics."
          action={<Link className="text-sm text-primary underline-offset-4 hover:underline" href="/dashboard/pipeline">Open pipeline</Link>}
        />
      ) : null}

      {applications.length > 0 ? (
        <>
          {needsAttention.length > 0 ? (
            <GlassCard className="border-border p-5">
              <h2 className="text-sm font-semibold">Needs attention</h2>
              <ul className="mt-3 space-y-2">
                {needsAttention.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/30"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ) : null}

          <GlassCard className="border-border p-6">
            <h2 className="text-base font-semibold">Pipeline funnel</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Share of applications by stage</p>
            <div className="mt-4 space-y-3">
              {pipelineStatuses.map((status) => {
                const count = metrics.byStatus[status];
                const width = metrics.total ? (count / metrics.total) * 100 : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize text-foreground">{status.replace("_", " ")}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
                      <div className={`h-full transition-all ${pipelineColors[status]}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="border-border p-6">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Latest updates</p>
            <ul className="mt-4 space-y-1">
              {recentActivity.map((application) => (
                <li key={application.id}>
                  <Link
                    href={`/dashboard/pipeline?app=${application.id}`}
                    className="flex items-center justify-between rounded-md border border-transparent px-2 py-2 text-sm transition-colors hover:border-border hover:bg-muted/20"
                  >
                    <div>
                      <p className="font-medium">{application.company}</p>
                      <p className="text-xs text-muted-foreground">{application.role}</p>
                    </div>
                    <span className="rounded-md border border-border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                      {application.status.replace("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </GlassCard>
        </>
      ) : null}
    </div>
  );
}
