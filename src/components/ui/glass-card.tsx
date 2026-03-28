"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTilt } from "@/hooks/use-tilt";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  tiltEnabled?: boolean;
  glowColor?: string;
}

export const GlassCard = ({
  children,
  className,
  tiltEnabled = true,
  glowColor,
}: GlassCardProps) => {
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(5);

  return (
    <motion.div
      style={{
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
        transformPerspective: 900,
        boxShadow: glowColor
          ? `0 0 35px ${glowColor}, 0 25px 50px oklch(0.1 0.02 260 / 35%)`
          : undefined,
      }}
      onMouseMove={tiltEnabled ? onMouseMove : undefined}
      onMouseLeave={tiltEnabled ? onMouseLeave : undefined}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "glass rounded-2xl shadow-card-3d transition-colors will-change-transform",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
