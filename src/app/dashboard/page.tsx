"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Briefcase, Info, Phone, Rocket, TrendingUp, Trophy } from "lucide-react";
import type { Application, Education, Experience, Profile, Project, Resume, Skill } from "@/types/database";
import {
  APPLICATION_STATUSES,
  INTERVIEW_STAGE_STATUSES,
  STATUS_GRADIENTS,
  STATUS_LABELS,
} from "@/lib/constants";
import { getProfileCompletion } from "@/lib/profile-completion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { WeeklyActivityChart } from "@/components/dashboard/weekly-activity-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container";
import { AnimatedCounter } from "@/components/motion/animated-counter";

type DashboardProfileResponse = {
  profile: Profile | null;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileCollections, setProfileCollections] = useState<Omit<DashboardProfileResponse, "profile">>({
    education: [],
    experience: [],
    projects: [],
    skills: [],
  });
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, appsRes] = await Promise.all([
          fetch("/api/profile", {
            credentials: "same-origin",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/applications", {
            credentials: "same-origin",
            headers: { Accept: "application/json" },
          }),
        ]);

        const profileData = (await profileRes.json()) as DashboardProfileResponse;
        const appsData = (await appsRes.json()) as Application[] | { error?: string };
        const resumesRes = await fetch("/api/resumes", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const resumesData = (await resumesRes.json()) as Resume[] | { error?: string };

        if (profileRes.ok) {
          setProfile(profileData.profile);
          setProfileCollections({
            education: profileData.education ?? [],
            experience: profileData.experience ?? [],
            projects: profileData.projects ?? [],
            skills: profileData.skills ?? [],
          });
        }
        if (appsRes.ok) setApplications(appsData as Application[]);
        if (resumesRes.ok) setResumes(resumesData as Resume[]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const stats = useMemo(() => {
    const total = applications.length;
    const interviews = applications.filter((app) =>
      INTERVIEW_STAGE_STATUSES.includes(app.status)
    ).length;
    const offers = applications.filter((app) => app.status === "offer").length;
    const saved = applications.filter((app) => app.status === "saved").length;
    const responseRate = total === 0 ? 0 : ((total - saved) / total) * 100;
    return { total, interviews, offers, responseRate };
  }, [applications]);

  const showDashboardEmptyState = useMemo(
    () => stats.total === 0 && stats.interviews === 0 && stats.offers === 0,
    [stats]
  );

  const completion = useMemo(
    () =>
      getProfileCompletion({
        profile,
        education: profileCollections.education,
        experience: profileCollections.experience,
        projects: profileCollections.projects,
        skills: profileCollections.skills,
        resumes,
      }),
    [profile, profileCollections, resumes]
  );
  const completionCircumference = 2 * Math.PI * 36;
  const completionOffset = completionCircumference - (completion.percentage / 100) * completionCircumference;

  const recentActivity = useMemo(() => {
    return [...applications]
      .sort((a, b) => {
        const aTime = new Date(a.updated_at ?? a.created_at).getTime();
        const bTime = new Date(b.updated_at ?? b.created_at).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [applications]);

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dayStr = date.toISOString().slice(0, 10);
      return {
        day: dayStr.slice(5),
        count: applications.filter((application) => application.created_at?.slice(0, 10) === dayStr).length,
      };
    });
  }, [applications]);

  const responseTrend = useMemo(() => {
    return Array.from({ length: 4 }, (_, index) => {
      const start = new Date();
      start.setDate(start.getDate() - (3 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const weekly = applications.filter((application) => {
        const created = new Date(application.created_at);
        return created >= start && created <= end;
      });
      const saved = weekly.filter((application) => application.status === "saved").length;
      const rate = weekly.length ? ((weekly.length - saved) / weekly.length) * 100 : 0;
      return { week: `W${index + 1}`, rate: Number(rate.toFixed(1)) };
    });
  }, [applications]);

  const statusCounts = useMemo(() => {
    const countByStatus = APPLICATION_STATUSES.reduce<Record<string, number>>((acc, status) => {
      acc[status] = applications.filter((application) => application.status === status).length;
      return acc;
    }, {});
    const total = Math.max(1, applications.length);
    return {
      total,
      rows: APPLICATION_STATUSES.map((status) => ({
        status: STATUS_LABELS[status],
        count: countByStatus[status] ?? 0,
        color: STATUS_GRADIENTS[status],
      })),
    };
  }, [applications]);

  const relativeTime = (input: string) => {
    const value = new Date(input);
    if (Number.isNaN(value.getTime())) return "just now";
    const diff = Date.now() - value.getTime();
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < hour) return `${Math.max(1, Math.round(diff / minute))}m ago`;
    if (diff < day) return `${Math.max(1, Math.round(diff / hour))}h ago`;
    if (diff < 2 * day) return "Yesterday";
    if (diff < 7 * day) return `${Math.max(1, Math.round(diff / day))}d ago`;
    return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-10">
        <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.full_name || "there"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your pipeline, spot bottlenecks, and move faster with focused actions.
          </p>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <StaggerContainer className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StaggerItem>
                <SpotlightCard>
                  <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                        Total Applications
                      </CardTitle>
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AnimatedCounter value={stats.total} />
                      <div className="mt-2 h-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={last7Days}>
                            <defs>
                              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </SpotlightCard>
              </StaggerItem>

              <StaggerItem>
                <SpotlightCard>
                  <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-400" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="flex cursor-help items-center gap-1 text-sm font-medium text-muted-foreground">
                            Interviews
                            <Info className="h-3 w-3 text-muted-foreground/50" />
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                          Applications that reached recruiter screens, interviews, finals, or take-home stages.
                        </TooltipContent>
                      </Tooltip>
                      <div className="rounded-lg bg-purple-500/10 p-2">
                        <Phone className="h-4 w-4 text-purple-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AnimatedCounter value={stats.interviews} />
                    </CardContent>
                  </Card>
                </SpotlightCard>
              </StaggerItem>

              <StaggerItem>
                <SpotlightCard>
                  <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Offers</CardTitle>
                      <div className="rounded-lg bg-green-500/10 p-2">
                        <Trophy className="h-4 w-4 text-green-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AnimatedCounter value={stats.offers} />
                    </CardContent>
                  </Card>
                </SpotlightCard>
              </StaggerItem>

              <StaggerItem>
                <SpotlightCard>
                  <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="flex cursor-help items-center gap-1 text-sm font-medium text-muted-foreground">
                            Response Rate
                            <Info className="h-3 w-3 text-muted-foreground/50" />
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                          The percentage of your applications that moved beyond &quot;Applied&quot; status.
                        </TooltipContent>
                      </Tooltip>
                      <div className="rounded-lg bg-amber-500/10 p-2">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AnimatedCounter value={Number(stats.responseRate.toFixed(1))} suffix="%" />
                      <div className="mt-2 h-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={responseTrend}>
                            <defs>
                              <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#responseGrad)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </SpotlightCard>
              </StaggerItem>
            </StaggerContainer>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  {statusCounts.rows.map((row) => (
                    <div
                      key={row.status}
                      className={`h-full bg-gradient-to-r ${row.color} transition-all duration-500`}
                      style={{ width: `${(row.count / statusCounts.total) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {statusCounts.rows.map((row) => (
                    <div key={row.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${row.color}`} />
                      <span>
                        {row.status}: {row.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2.5">
              <Button asChild className="transition-all duration-200 md:hover:-translate-y-0.5">
                <Link href="/dashboard/tracker">Add Application</Link>
              </Button>
              <Button asChild variant="secondary" className="transition-all duration-200 md:hover:-translate-y-0.5">
                <Link href="/dashboard/analyze">Analyze Resume</Link>
              </Button>
              <Button asChild variant="outline" className="transition-all duration-200 md:hover:-translate-y-0.5">
                <Link href="/dashboard/email">Generate Email</Link>
              </Button>
            </div>

            {showDashboardEmptyState ? (
              <EmptyState
                icon={Rocket}
                title="Your pipeline is empty"
                description="Add your first application to get started!"
              />
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <PipelineChart applications={applications} />
              <WeeklyActivityChart applications={applications} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20">
                  <svg className="h-20 w-20 -rotate-90">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke={completion.percentage === 100 ? "hsl(142 71% 45%)" : "hsl(var(--primary))"}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={completionCircumference}
                      initial={{ strokeDashoffset: completionCircumference }}
                      animate={{ strokeDashoffset: completionOffset }}
                      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                    {completion.percentage}%
                  </div>
                </div>
                <div className="space-y-2">
                  {completion.percentage === 100 ? (
                    <p className="text-sm font-medium text-green-600">Profile Complete!</p>
                  ) : (
                    completion.items
                      .filter((item) => !item.completed)
                      .slice(0, 3)
                      .map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {item.label}
                        </Link>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet. Add your first application to get started.</p>
                ) : (
                  recentActivity.map((app) => (
                    <div key={app.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                          <p className="truncate text-sm font-semibold">{app.company}</p>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{app.role}</p>
                      </div>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {relativeTime(app.updated_at ?? app.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}
