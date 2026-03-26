"use client";

import { useEffect, useRef } from "react";
import { setupGsap, ScrollTrigger } from "@/components/animations/gsap";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";
import { cn } from "@/lib/utils";

interface GsapStaggerRevealProps {
  children: React.ReactNode;
  className?: string;
  itemSelector?: string;
  y?: number;
  stagger?: number;
  duration?: number;
  start?: string;
}

export const GsapStaggerReveal = ({
  children,
  className,
  itemSelector = "[data-reveal-item]",
  y = 40,
  stagger = 0.12,
  duration = 0.75,
  start = "top 82%",
}: GsapStaggerRevealProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current || prefersReducedMotion()) {
      return;
    }

    const gsap = setupGsap();
    const targets = rootRef.current.querySelectorAll(itemSelector);
    if (!targets.length) {
      return;
    }

    const tween = gsap.fromTo(
      targets,
      { y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start,
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      tween.kill();
      ScrollTrigger.refresh();
    };
  }, [itemSelector, y, stagger, duration, start]);

  return (
    <div ref={rootRef} className={cn(className)}>
      {children}
    </div>
  );
};
