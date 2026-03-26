"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import { initGsap, gsap } from "@/lib/gsap-config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SmoothScrollProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export const SmoothScroll = ({ children }: SmoothScrollProps) => {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    initGsap();
    if (reducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    } as never);
    window.__lenis = lenis;

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      window.__lenis = undefined;
      lenis.destroy();
    };
  }, [reducedMotion]);

  return <>{children}</>;
};
