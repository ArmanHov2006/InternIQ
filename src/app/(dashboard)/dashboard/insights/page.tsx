"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Application } from "@/types/database";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { FeatureErrorBoundary } from "@/components/error-boundary";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type Resume = {
  id: string;
  parsed_text: string;
  is_primary: boolean;
};

const scorePriority = (app: Application): number => {
  const now = Date.now();
  const ageDays = Math.max(0, (now - new Date(app.created_at).getTime()) / (24 * 60 * 60 * 1000));
  const freshnessBoost = Math.max(0, 20 - ageDays);
  const fit = typeof app.fit_score === "number" ? app.fit_score : 45;
  const stageWeight =
    app.status === "saved" ? 25 : app.status === "applied" ? 18 : app.status === "interview" ? 15 : app.status === "offer" ? 5 : 0;
  const hasJobUrl = app.job_url?.trim() ? 8 : 0;
  return Math.round(fit * 0.55 + freshnessBoost + stageWeight + hasJobUrl);
};

export default function InsightsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [generatingPack, setGeneratingPack] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [appRes, resumeRes] = await Promise.all([
          fetch("/api/applications", { credentials: "same-origin", headers: { Accept: "application/json" } }),
          fetch("/api/resumes", { credentials: "same-origin", headers: { Accept: "application/json" } }),
        ]);
        if (appRes.ok) {
          const nextApps = (await appRes.json()) as Application[];
          setApplications(nextApps);
          if (nextApps.length) setSelectedId((current) => current || nextApps[0].id);
        }
        if (resumeRes.ok) setResumes((await resumeRes.json()) as Resume[]);
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

  const prioritized = useMemo(
    () =>
      [...applications]
        .map((app) => ({ app, score: scorePriority(app) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [applications]
  );

  const followUps = useMemo(() => {
    const now = Date.now();
    return applications
      .filter((app) => app.status === "applied" || app.status === "interview")
      .map((app) => {
        const lastTouch = new Date(app.updated_at).getTime();
        const staleDays = Math.floor((now - lastTouch) / (24 * 60 * 60 * 1000));
        return { app, staleDays };
      })
      .filter((entry) => entry.staleDays >= 5)
      .sort((a, b) => b.staleDays - a.staleDays)
      .slice(0, 5);
  }, [applications]);

  const selectedApplication = useMemo(
    () => applications.find((app) => app.id === selectedId) ?? null,
    [applications, selectedId]
  );

  const primaryResumeText = useMemo(() => {
    const primary = resumes.find((r) => r.is_primary) ?? resumes[0];
    return primary?.parsed_text?.trim() ?? "";
  }, [resumes]);

  const generateApplicationPack = async () => {
    if (!selectedApplication) return;
    if (!selectedApplication.job_url?.trim()) {
      toast.error("Selected application needs a job URL.");
      return;
    }
    if (!primaryResumeText) {
      toast.error("Upload a resume in Settings before generating a pack.");
      return;
    }
    setGeneratingPack(true);
    try {
      const [analyzeRes, emailRes, coverRes] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ job_url: selectedApplication.job_url, resume_text: primaryResumeText }),
        }),
        fetch("/api/email/generate", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            job_url: selectedApplication.job_url,
            resume_text: primaryResumeText,
            company: selectedApplication.company,
            role: selectedApplication.role,
            contact_name: selectedApplication.contact_name || undefined,
          }),
        }),
        fetch("/api/cover-letter/generate", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            job_url: selectedApplication.job_url,
            resume_text: primaryResumeText,
            company: selectedApplication.company,
            role: selectedApplication.role,
          }),
        }),
      ]);
      const analyzePayload = (await analyzeRes.json()) as { fit_score?: number; analysis?: unknown; error?: string };
      const emailPayload = (await emailRes.json()) as { email?: string; subject?: string; error?: string };
      const coverPayload = (await coverRes.json()) as Record<string, unknown> & { error?: string };
      if (!analyzeRes.ok) throw new Error(analyzePayload.error || "Analyze failed.");
      if (!emailRes.ok) throw new Error(emailPayload.error || "Email generation failed.");
      if (!coverRes.ok) throw new Error(coverPayload.error || "Cover letter generation failed.");

      const nextMeta = {
        ...(selectedApplication.ai_metadata && typeof selectedApplication.ai_metadata === "object"
          ? selectedApplication.ai_metadata
          : {}),
        coverLetter: {
          generated_at: new Date().toISOString(),
          result: coverPayload,
        },
      };

      const updateRes = await fetch("/api/applications", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          id: selectedApplication.id,
          fit_score: analyzePayload.fit_score ?? null,
          fit_analysis: typeof analyzePayload.analysis === "string" ? analyzePayload.analysis : JSON.stringify(analyzePayload.analysis ?? {}),
          generated_email:
            typeof emailPayload.email === "string" ? emailPayload.email : typeof emailPayload.subject === "string" ? emailPayload.subject : "",
          ai_metadata: nextMeta,
        }),
      });
      const updated = (await updateRes.json()) as Application | { error?: string };
      if (!updateRes.ok) throw new Error((updated as { error?: string }).error || "Failed to save generated pack.");
      const updatedApp = updated as Application;
      setApplications((prev) => prev.map((app) => (app.id === updatedApp.id ? updatedApp : app)));
      toast.success("Application pack generated and saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate application pack.");
    } finally {
      setGeneratingPack(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">Read-only analytics from your pipeline</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonShimmer className="h-20" />
            <SkeletonShimmer className="h-20" />
            <SkeletonShimmer className="h-20" />
            <SkeletonShimmer className="h-20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonShimmer className="h-56" />
            <SkeletonShimmer className="h-56" />
          </div>
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title="Insights need data"
          description="Add at least 3 applications to unlock analytics and AI-powered recommendations."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/pipeline">Go to pipeline</Link>
            </Button>
          }
        />
      ) : (
        <FeatureErrorBoundary title="Insights error" description="Analytics encountered an error. Your data is safe — try again.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="mt-1 text-2xl font-mono font-semibold">{applications.length}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Response rate</p>
              <p className="mt-1 text-2xl font-mono font-semibold">{responseRate}%</p>
              <p className="text-xs text-muted-foreground">Past &quot;saved&quot; stage</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg. days since update</p>
              <p className="mt-1 text-2xl font-mono font-semibold">{avgDaysSinceUpdate}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">This week (new)</p>
              <p className="mt-1 text-2xl font-mono font-semibold">{velocity[7] ?? 0}</p>
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

          <GlassCard className="p-6 shadow-glow-xs">
            <h2 className="text-base font-semibold">AI job fit prioritizer</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Recommended next applications based on fit, freshness, and stage.</p>
            <ul className="mt-4 space-y-2">
              {prioritized.map(({ app, score }) => (
                <li key={app.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{app.company}</p>
                    <p className="text-xs text-muted-foreground">{app.role}</p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    Priority {score}
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-6 shadow-glow-xs">
            <h2 className="text-base font-semibold">Batch prep tools</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Select one application and generate a full preparation pack.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label>Application</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.company} — {app.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" className="self-end" disabled={generatingPack || !selectedApplication} onClick={() => void generateApplicationPack()}>
                {generatingPack ? "Generating..." : "Generate Application Pack"}
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6 shadow-glow-xs">
            <h2 className="text-base font-semibold">Follow-up copilot</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Applications that likely need follow-up based on inactivity.</p>
            {followUps.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No urgent follow-ups detected.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {followUps.map(({ app, staleDays }) => (
                  <li key={app.id} className="rounded-md border border-border px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{app.company} — {app.role}</p>
                      <span className="text-xs text-muted-foreground">{staleDays} days since last update</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Suggested action: send a concise follow-up mentioning continued interest and one role-specific value point.
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </FeatureErrorBoundary>
      )}
    </div>
  );
}
