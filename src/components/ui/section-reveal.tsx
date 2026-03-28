"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { blurIn, fadeInLeft, fadeInUp, scaleIn } from "@/lib/animations";

type RevealVariant = "fade-up" | "slide-left" | "scale-in" | "blur-in";

interface SectionRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
}

const variants = {
  "fade-up": fadeInUp,
  "slide-left": fadeInLeft,
  "scale-in": scaleIn,
  "blur-in": blurIn,
};

export const SectionReveal = ({
  children,
  variant = "fade-up",
  delay = 0,
  className,
}: SectionRevealProps) => {
  const selected = variants[variant];
  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-10%" }}
      variants={selected}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};
