"use client";

import { memo } from "react";
import {
  motion,
  type Variants,
  type DOMMotionComponents,
  type MotionProps,
} from "motion/react";
import { cn } from "@/lib/utils";

type AnimationType = "text" | "word" | "character" | "line";
type AnimationVariant =
  | "fadeIn"
  | "blurIn"
  | "blurInUp"
  | "blurInDown"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "scaleDown";

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
} as const;

type MotionElementType = Extract<
  keyof DOMMotionComponents,
  keyof typeof motionElements
>;

interface TextAnimateProps extends Omit<MotionProps, "children"> {
  children: string;
  className?: string;
  segmentClassName?: string;
  delay?: number;
  duration?: number;
  as?: MotionElementType;
  by?: AnimationType;
  startOnView?: boolean;
  once?: boolean;
  animation?: AnimationVariant;
}

const itemVariantsMap: Record<AnimationVariant, Variants> = {
  fadeIn: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  },
  blurIn: {
    hidden: { opacity: 0, filter: "blur(8px)" },
    show: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.3 } },
  },
  blurInUp: {
    hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.35 } },
  },
  blurInDown: {
    hidden: { opacity: 0, y: -18, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.35 } },
  },
  slideUp: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  },
  slideDown: {
    hidden: { opacity: 0, y: -16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  },
  slideRight: {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.75 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, type: "spring", damping: 15, stiffness: 300 },
    },
  },
  scaleDown: {
    hidden: { opacity: 0, scale: 1.25 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, type: "spring", damping: 15, stiffness: 300 },
    },
  },
};

const TextAnimateBase = ({
  children,
  delay = 0,
  duration = 0.4,
  className,
  segmentClassName,
  as: Component = "p",
  startOnView = true,
  once = true,
  by = "word",
  animation = "fadeIn",
  ...props
}: TextAnimateProps) => {
  const MotionComponent = motionElements[Component];
  const segments =
    by === "character"
      ? children.split("")
      : by === "line"
        ? children.split("\n")
        : by === "text"
          ? [children]
          : children.split(/(\s+)/);

  return (
    <MotionComponent
      initial="hidden"
      whileInView={startOnView ? "show" : undefined}
      animate={startOnView ? undefined : "show"}
      viewport={{ once }}
      transition={{
        delayChildren: delay,
        staggerChildren: Math.max(duration / Math.max(segments.length, 1), 0.01),
      }}
      className={cn("whitespace-pre-wrap", className)}
      {...props}
    >
      {segments.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          variants={itemVariantsMap[animation]}
          className={cn(
            by === "line" ? "block" : "inline-block whitespace-pre",
            segmentClassName
          )}
        >
          {segment}
        </motion.span>
      ))}
    </MotionComponent>
  );
};

export const TextAnimate = memo(TextAnimateBase);
