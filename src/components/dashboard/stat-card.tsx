"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  trend?: string;
  data: { value: number }[];
}

export const StatCard = ({ label, value, suffix = "", trend, data }: StatCardProps) => {
  return (
    <GlassCard className="relative overflow-hidden p-5">
      <span className="absolute inset-y-4 left-0 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <AnimatedCounter target={value} suffix={suffix} className="mt-1 text-3xl font-display" />
      {trend ? <p className="mt-1 text-xs text-muted-foreground">{trend}</p> : null}
      <div className="mt-4 h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
