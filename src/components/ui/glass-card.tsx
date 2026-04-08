"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Retained for API compatibility; premium stat cards use flat borders per design system. */
  tiltEnabled?: boolean;
  glowColor?: string;
}

export const GlassCard = ({ children, className, glowColor }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-none transition-colors duration-100",
        "hover:border-primary/20",
        glowColor && "shadow-glow-sm",
        className
      )}
      style={glowColor ? { boxShadow: `0 0 24px ${glowColor}` } : undefined}
    >
      {children}
    </div>
  );
};
