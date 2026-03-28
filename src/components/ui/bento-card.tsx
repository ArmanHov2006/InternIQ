import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface BentoCardProps {
  colSpan?: number;
  rowSpan?: number;
  children: ReactNode;
  className?: string;
}

export const BentoCard = ({ colSpan = 1, rowSpan = 1, children, className }: BentoCardProps) => {
  return (
    <GlassCard
      className={cn(
        "p-5 h-full",
        colSpan === 2 && "lg:col-span-2",
        rowSpan === 2 && "lg:row-span-2",
        className
      )}
    >
      {children}
    </GlassCard>
  );
};
