import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
}

/** Marketing bento tile — grid column/row span lives on the parent (`SectionReveal`), not here. */
export const BentoCard = ({ children, className }: BentoCardProps) => {
  return (
    <GlassCard
      className={cn(
        "h-full p-5 shadow-sm transition-shadow duration-150 ease-out hover:shadow-md",
        className
      )}
    >
      {children}
    </GlassCard>
  );
};
