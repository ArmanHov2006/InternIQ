"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion";

type Props = {
  value: number;
  suffix?: string;
  duration?: number;
};

export function AnimatedCounter({ value, suffix = "", duration = 2 }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (latest) => {
      setDisplay(Math.max(0, Math.round(latest)).toLocaleString());
    });
    return () => unsubscribe();
  }, [motionValue]);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(Math.max(0, Math.round(value)).toLocaleString());
      motionValue.set(value);
      return;
    }
    if (!isInView) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });

    return () => controls.stop();
  }, [duration, isInView, motionValue, reduceMotion, value]);

  return (
    <span ref={ref} className="text-4xl font-extrabold tracking-tight lg:text-5xl">
      {display}
      {suffix}
    </span>
  );
}
