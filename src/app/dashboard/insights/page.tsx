"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Application } from "@/types/database";
import {
  APPLICATION_STATUSES,
  INTERVIEW_STAGE_STATUSES,
  STATUS_CHART_COLORS,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const statusColors: Record<ApplicationStatus, string> = STATUS_CHART_COLORS;
const statusOrder: ApplicationStatus[] = [...APPLICATION_STATUSES];

export default function InsightsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/applications", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const payload = (await res.json()) as Application[] | { error?: string };
        if (res.ok) setApplications(payload as Application[]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const statusCounts = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        label: STATUS_LABELS[status],
        count: applications.filter((app) => app.status === status).length,
        color: statusColors[status],
      })),
    [applications]
  );

  const funnelStages = useMemo(() => {
    const saved = statusCounts.find((status) => status.status === "saved")?.count ?? 0;
    const applied = statusCounts.find((status) => status.status === "applied")?.count ?? 0;
    const recruiterScreen =
      statusCounts.find((status) => status.status === "recruiter_screen")?.count ?? 0;
    const hiringManager =
      statusCounts.find((status) => status.status === "hiring_manager")?.count ?? 0;
    const finalRound = statusCounts.find((status) => status.status === "final_round")?.count ?? 0;
    const takeHome = statusCounts.find((status) => status.status === "take_home")?.count ?? 0;
    const offer = statusCounts.find((status) => status.status === "offer")?.count ?? 0;
    return [
      { label: "Saved", count: saved, color: "bg-blue-500" },
      { label: "Applied", count: applied, color: "bg-indigo-500" },
      { label: "Recruiter Screen", count: recruiterScreen, color: "bg-cyan-500" },
      { label: "Hiring Manager", count: hiringManager, color: "bg-violet-500" },
      { label: "Final Round", count: finalRound, color: "bg-fuchsia-500" },
      { label: "Take Home", count: takeHome, color: "bg-orange-500" },
      { label: "Offer", count: offer, color: "bg-green-500" },
    ];
  }, [statusCounts]);

  const weeklyData = useMemo(() => {
    const points = Array.from({ length: 8 }).map((_, index) => {
      const start = new Date();
      start.setDate(start.getDate() - (7 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const count = applications.filter((app) => {
        const created = new Date(app.created_at);
        return created >= start && created <= end;
      }).length;
      return {
        week: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        count,
      };
    });
    return points;
  }, [applications]);

  const total = applications.length;
  const metrics = useMemo(() => {
    const byWeekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, dayIndex) => ({
      day,
      count: applications.filter((app) => new Date(app.created_at).getDay() === dayIndex).length,
    }));
    const mostActive = byWeekday.sort((a, b) => b.count - a.count)[0]?.day ?? "N/A";
    const offerCount = statusCounts.find((status) => status.status === "offer")?.count ?? 0;
    const interviewCount = INTERVIEW_STAGE_STATUSES.reduce((sum, stage) => {
      return sum + (statusCounts.find((status) => status.status === stage)?.count ?? 0);
    }, 0);
    const responseRate = total ? (((total - (statusCounts.find((s) => s.status === "saved")?.count ?? 0)) / total) * 100) : 0;
    return {
      responseRate: responseRate.toFixed(1),
      mostActive,
      interviews: interviewCount,
      offers: offerCount,
    };
  }, [applications, statusCounts, total]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const maxCount = Math.max(...funnelStages.map((stage) => stage.count), 1);

  return (
    <PageTransition>
      <motion.div
        className="space-y-6 pb-10"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-sm text-muted-foreground">Understand your internship pipeline performance at a glance.</p>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Funnel</CardTitle>
              <CardDescription>Conversion between stages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {funnelStages.map((stage, index) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="w-28 text-right text-sm text-muted-foreground">{stage.label}</span>
                  <motion.div
                    className={`flex h-10 items-center justify-end rounded-lg pr-3 text-white ${stage.color}`}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${(stage.count / maxCount) * 100}%`, opacity: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.08 }}
                  >
                    <span className="text-sm font-semibold">{stage.count.toLocaleString()}</span>
                  </motion.div>
                  {index < funnelStages.length - 1 && stage.count > 0 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="w-12 cursor-help text-xs text-muted-foreground">
                          {Math.round((funnelStages[index + 1].count / stage.count) * 100)}%
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Conversion rate from one stage to the next.
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="grid gap-6 lg:grid-cols-2" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Activity</CardTitle>
              <CardDescription>Applications added per week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#areaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Breakdown</CardTitle>
              <CardDescription>Current pipeline distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[220px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusCounts} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="count">
                      {statusCounts.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{total.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{metrics.responseRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Most Active Day</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{metrics.mostActive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{metrics.interviews.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{metrics.offers.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
