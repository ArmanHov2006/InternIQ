"use client";

import { motion } from "framer-motion";

interface GradientOrbProps {
  size: number;
  color1: string;
  color2: string;
  className?: string;
}

export const GradientOrb = ({ size, color1, color2, className }: GradientOrbProps) => {
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute rounded-full blur-[80px] ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color1} 0%, ${color2} 100%)`,
      }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -40, 20, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
    />
  );
};
