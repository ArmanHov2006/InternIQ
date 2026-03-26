"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Application } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  applications: Application[];
};

function getIsoWeekStart(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function WeeklyActivityChart({ applications }: Props) {
  const now = new Date();
  const weeks: { key: string; label: string; count: number }[] = [];

  for (let i = 7; i >= 0; i -= 1) {
    const base = new Date(now);
    base.setDate(base.getDate() - i * 7);
    const start = getIsoWeekStart(base);
    const key = start.toISOString().slice(0, 10);
    const label = `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()}`;
    weeks.push({ key, label, count: 0 });
  }

  for (const app of applications) {
    const created = app.created_at ? new Date(app.created_at) : null;
    if (!created || Number.isNaN(created.getTime())) continue;
    const weekKey = getIsoWeekStart(created).toISOString().slice(0, 10);
    const bucket = weeks.find((week) => week.key === weekKey);
    if (bucket) bucket.count += 1;
  }

  const hasData = weeks.some((week) => week.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeks}>
              <defs>
                <linearGradient id="weeklyBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <Area
                dataKey="count"
                type="monotone"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#weeklyBlue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
