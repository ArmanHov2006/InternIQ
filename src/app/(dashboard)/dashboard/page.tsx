"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, ArrowRight, CheckCircle2, Mail, BookOpen, AlertTriangle, CheckCheck } from "lucide-react";
import type { Application } from "@/types/database";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/dashboard/stat-card-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

function relativeTime(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

function weeklyCreationTrend(apps: Application[]): { value: number }[] {
  const now = Date.now(), weekMs = 604800000, buckets = Array.from({ length: 6 }, () => 0);
  for (const app of apps) {
    const w = Math.floor((now - new Date(app.created_at).getTime()) / weekMs);
    if (w >= 0 && w < 6) buckets[5 - w] += 1;
  }
  return buckets.map((value) => ({ value }));
}

type SuggestionRow = { id: string; application_id: string; status: string; reason?: string };

const severityConfig = {
  gmail: { dot: "bg-blue-500", icon: Mail },
  interview: { dot: "bg-purple-500", icon: BookOpen },
  stale: { dot: "bg-orange-500", icon: AlertTriangle },
} as const;

type AttentionItem = { id: string; label: string; context: string; href: string; severity: keyof typeof severityConfig };

function StepItem({ step, done, title, description, href }: { step: number; done: boolean; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-md px-3 py-3 transition-colors hover:bg-muted/30">
      <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium", done ? "bg-green-500/15 text-green-600 dark:text-green-400" : "border border-border text-muted-foreground")}>
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [hasResume, setHasResume] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const [appRes, sugRes, resumeRes] = await Promise.all([
          fetch("/api/applications", { credentials: "same-origin", headers: { Accept: "application/json" } }),
          fetch("/api/automation/status-suggestions", { credentials: "same-origin", headers: { Accept: "application/json" } }).catch(
            () => null
          ),
          fetch("/api/resumes", { credentials: "same-origin", headers: { Accept: "application/json" } }).catch(
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
        if (resumeRes?.ok) {
          const resumes = (await resumeRes.json()) as unknown[];
          setHasResume(Array.isArray(resumes) && resumes.length > 0);
        }
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  // Trigger bar animation after mount
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

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
    const items: AttentionItem[] = [];
    for (const s of suggestions.filter((s) => s.status === "pending"))
      items.push({ id: `sug-${s.id}`, label: "Review Gmail status suggestion", context: s.reason || "New status detected from email", href: "/dashboard/settings?section=integrations", severity: "gmail" });
    const hasPrep = (a: Application) => {
      const m = a.ai_metadata;
      return m && typeof m === "object" && "interviewPrep" in m && m.interviewPrep && typeof m.interviewPrep === "object" && Array.isArray((m.interviewPrep as { questions?: unknown }).questions) && (m.interviewPrep as { questions: unknown[] }).questions.length > 0;
    };
    for (const a of applications.filter((a) => a.status === "interview" && !hasPrep(a)))
      items.push({ id: `prep-${a.id}`, label: `${a.company} — interview prep needed`, context: `${a.role} — no prep questions generated yet`, href: `/dashboard/pipeline?app=${a.id}`, severity: "interview" });
    for (const a of applications.filter((a) => a.status === "saved" && Date.now() - new Date(a.created_at).getTime() > 604800000))
      items.push({ id: `stale-${a.id}`, label: `${a.company} — saved over 7 days`, context: `${a.role} — consider applying or removing`, href: `/dashboard/pipeline?app=${a.id}`, severity: "stale" });
    return items;
  }, [applications, suggestions]);

  const needsAttentionVisible = needsAttention.slice(0, 3);
  const needsAttentionTotal = needsAttention.length;

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

      {/* Getting Started (empty state) */}
      {applications.length === 0 && !loading ? (
        <GlassCard className="border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Getting started</h2>
          </div>
          <div className="space-y-1">
            <StepItem
              step={1}
              done={hasResume}
              title="Upload your resume"
              description="Your resume powers AI fit scoring and tailored suggestions."
              href="/dashboard/settings?section=resumes"
            />
            <StepItem
              step={2}
              done={false}
              title="Set discovery preferences"
              description="Tell us your target roles, locations, and industries."
              href="/dashboard/discover"
            />
            <StepItem
              step={3}
              done={false}
              title="Add your first application"
              description="Track applications through your pipeline from saved to offer."
              href="/dashboard/pipeline"
            />
          </div>
        </GlassCard>
      ) : null}

      {applications.length > 0 ? (
        <>
          {/* Needs attention */}
          {needsAttentionVisible.length > 0 ? (
            <GlassCard className="border-border p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Needs attention</h2>
                {needsAttentionTotal > 3 && (
                  <Link
                    href="/dashboard/pipeline"
                    className="text-xs text-primary hover:underline underline-offset-4"
                  >
                    View all ({needsAttentionTotal})
                  </Link>
                )}
              </div>
              <ul className="mt-3 space-y-2">
                {needsAttentionVisible.map((item) => {
                  const config = severityConfig[item.severity];
                  const Icon = config.icon;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex items-start gap-3 rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted/30"
                      >
                        <div className="mt-0.5 flex items-center gap-2 shrink-0">
                          <span className={cn("h-2 w-2 rounded-full", config.dot)} />
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.context}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </GlassCard>
          ) : (
            <GlassCard className="border-border p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCheck className="h-4 w-4" />
                <p className="text-sm">You&apos;re all caught up &mdash; nothing needs attention right now.</p>
              </div>
            </GlassCard>
          )}

          {/* Pipeline funnel */}
          <GlassCard className="border-border p-6">
            <h2 className="text-base font-semibold">Pipeline funnel</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Share of applications by stage</p>
            <div className="mt-4 space-y-3">
              {pipelineStatuses.map((status) => {
                const count = metrics.byStatus[status];
                const pct = metrics.total ? Math.round((count / metrics.total) * 100) : 0;
                const width = mounted ? pct : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize text-foreground">{status.replace("_", " ")}</span>
                      <span className="text-muted-foreground">
                        {count} <span className="font-mono text-muted-foreground/70">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700 ease-out", pipelineColors[status])}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Recent activity */}
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
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{application.company}</p>
                      <p className="text-xs text-muted-foreground truncate">{application.role}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {relativeTime(application.updated_at)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize",
                          STATUS_COLORS[application.status as keyof typeof STATUS_COLORS]
                        )}
                      >
                        {STATUS_LABELS[application.status as keyof typeof STATUS_LABELS] ?? application.status}
                      </Badge>
                    </div>
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
