"use client";

import { useRef } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  type MotionProps,
  type UseInViewOptions,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

type MarginType = UseInViewOptions["margin"];

interface BlurFadeProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  offset?: number;
  direction?: "up" | "down" | "left" | "right";
  inView?: boolean;
  inViewMargin?: MarginType;
  blur?: string;
  variant?: Variants;
}

export const BlurFade = ({
  children,
  className,
  duration = 0.4,
  delay = 0,
  offset = 8,
  direction = "down",
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
  variant,
  ...props
}: BlurFadeProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const enteredView = useInView(ref, { once: true, margin: inViewMargin });
  const active = !inView || enteredView;
  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const signedOffset =
    direction === "right" || direction === "down" ? -offset : offset;

  const defaultVariants: Variants = {
    hidden: {
      [axis]: signedOffset,
      opacity: 0,
      filter: `blur(${blur})`,
    },
    visible: {
      [axis]: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={active ? "visible" : "hidden"}
        exit="hidden"
        variants={variant ?? defaultVariants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: "easeOut",
          filter: { duration },
        }}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
