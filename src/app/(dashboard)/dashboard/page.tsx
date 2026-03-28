"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Application } from "@/types/database";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/dashboard/stat-card-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { IconFrame, PlusGlyph, SearchGlyph, WandGlyph } from "@/components/ui/icons/premium-icons";
import { EmptyState } from "@/components/ui/empty-state";
import { dispatchOpenAddApplication } from "@/lib/events";

const sparkline = [{ value: 2 }, { value: 4 }, { value: 5 }, { value: 8 }, { value: 9 }, { value: 12 }];
const pipelineStatuses: Application["status"][] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];
const pipelineColors: Record<Application["status"], string> = {
  saved: "bg-blue-500/70",
  applied: "bg-indigo-500/70",
  interview: "bg-purple-500/70",
  offer: "bg-emerald-500/70",
  rejected: "bg-rose-500/70",
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/applications", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const data = (await res.json()) as Application[];
        if (res.ok) setApplications(data);
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
        acc[status] = applications.filter((application) => application.status === status).length;
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

  const recentActivity = applications.slice(0, 6);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl md:text-5xl">Overview</h1>
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard label="Total Applications" value={metrics.total} trend="Across all stages" data={sparkline} />
          <StatCard label="Active Interviews" value={metrics.activeInterviews} trend="Interview rounds in progress" data={sparkline} />
          <StatCard label="Response Rate" value={metrics.responseRate} suffix="%" trend="Moved beyond saved stage" data={sparkline} />
          <StatCard label="Offers" value={metrics.offers} trend={metrics.offers > 0 ? "Momentum building" : "No offers yet"} data={sparkline} />
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <MagneticButton
          className="gap-2"
          onClick={() => {
            dispatchOpenAddApplication();
          }}
        >
          <IconFrame className="h-6 w-6 rounded-md border-white/10 bg-white/[0.03]">
            <PlusGlyph />
          </IconFrame>
          Add Application
        </MagneticButton>
        <MagneticButton
          variant="outline"
          className="gap-2"
          onClick={() => router.push("/dashboard/profile")}
        >
          <IconFrame className="h-6 w-6 rounded-md border-white/10 bg-white/[0.03]">
            <SearchGlyph />
          </IconFrame>
          Upload Resume
        </MagneticButton>
        <MagneticButton
          variant="outline"
          className="gap-2"
          onClick={() => router.push("/dashboard/email")}
        >
          <IconFrame className="h-6 w-6 rounded-md border-white/10 bg-white/[0.03]">
            <WandGlyph />
          </IconFrame>
          Generate Email
        </MagneticButton>
      </div>
      {applications.length === 0 && !loading ? (
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title="No dashboard data yet"
          description="Add your first application to unlock real-time analytics and activity history."
          action={
            <MagneticButton
              className="gap-2"
              onClick={() => {
                dispatchOpenAddApplication();
              }}
            >
              <Plus className="h-4 w-4" />
              Add Application
            </MagneticButton>
          }
        />
      ) : null}
      {applications.length > 0 ? (
        <>
          <GlassCard className="p-5">
            <h2 className="text-xl font-semibold">Pipeline Funnel</h2>
            <div className="mt-4 overflow-hidden rounded-full border border-white/10 bg-white/5">
              <div className="flex h-4 w-full">
                {pipelineStatuses.map((status) => {
                  const width = metrics.total ? (metrics.byStatus[status] / metrics.total) * 100 : 0;
                  if (width === 0) return null;
                  return <div key={status} className={pipelineColors[status]} style={{ width: `${width}%` }} />;
                })}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {pipelineStatuses.map((status) => (
                <span key={status} className="inline-flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${pipelineColors[status]}`} />
                  {status.replace("_", " ")} ({metrics.byStatus[status]})
                </span>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {recentActivity.map((application) => (
                <li key={application.id}>
                  {application.company} · {application.role} · {application.status.replace("_", " ")}
                </li>
              ))}
            </ul>
          </GlassCard>
        </>
      ) : null}
    </div>
  );
}
