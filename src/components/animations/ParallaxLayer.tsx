"use client";

import { useEffect, useRef } from "react";
import { initGsap, gsap } from "@/lib/gsap-config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ParallaxLayerProps {
  speed: number;
  children: React.ReactNode;
  className?: string;
}

export const ParallaxLayer = ({ speed, children, className }: ParallaxLayerProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    initGsap();
    if (!ref.current || reducedMotion) {
      return;
    }

    const tween = gsap.to(ref.current, {
      y: speed * 200,
      ease: "none",
      scrollTrigger: {
        trigger: ref.current,
        scrub: 1,
        start: "top bottom",
        end: "bottom top",
      },
    });

    return () => {
      tween.kill();
    };
  }, [speed, reducedMotion]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
