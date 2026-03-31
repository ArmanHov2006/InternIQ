"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  trend?: string;
  /** Optional weekly trend from real data; omit to hide chart */
  data?: { value: number }[];
}

export const StatCard = ({ label, value, suffix = "", trend, data }: StatCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors duration-100",
        "hover:border-primary/20"
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <AnimatedCounter
        target={value}
        suffix={suffix}
        className="mt-1 block text-[32px] font-bold leading-none tracking-tight text-card-foreground font-mono"
      />
      {trend ? (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-[#4ADE80]">
          <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {trend}
        </p>
      ) : null}
      {data && data.length > 0 ? (
        <div className="mt-4 h-14">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
};
