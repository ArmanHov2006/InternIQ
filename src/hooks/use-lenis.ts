"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";

export const useLenis = () => {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      wheelMultiplier: 0.9,
      lerp: 0.08,
      smoothWheel: true,
      touchMultiplier: 1.2,
    });

    let frameId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = window.requestAnimationFrame(raf);
    };

    frameId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);
};
