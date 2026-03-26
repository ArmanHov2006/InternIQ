"use client";

import { useEffect, useRef } from "react";
import { initGsap, gsap } from "@/lib/gsap-config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Direction = "up" | "down" | "left" | "right";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export const ScrollReveal = ({
  children,
  direction = "up",
  distance = 60,
  duration = 0.8,
  delay = 0,
  className,
}: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    initGsap();
    if (!ref.current || reducedMotion) {
      return;
    }

    const x = direction === "left" ? distance : direction === "right" ? -distance : 0;
    const y = direction === "up" ? distance : direction === "down" ? -distance : 0;

    const tween = gsap.fromTo(
      ref.current,
      { opacity: 0, x, y, filter: "blur(4px)" },
      {
        opacity: 1,
        x: 0,
        y: 0,
        filter: "blur(0px)",
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );

    return () => {
      tween.kill();
    };
  }, [direction, distance, duration, delay, reducedMotion]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
