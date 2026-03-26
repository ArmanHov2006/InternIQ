"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";

interface VantaSurfaceProps {
  className?: string;
}

export const VantaSurface = ({ className }: VantaSurfaceProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const effectRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!hostRef.current || prefersReducedMotion()) {
      return;
    }

    import("vanta/dist/vanta.net.min").then(({ default: NET }) => {
      effectRef.current = NET({
        el: hostRef.current as HTMLElement,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x2563eb,
        backgroundColor: 0x0f2440,
        points: 8.0,
        maxDistance: 24.0,
        spacing: 18.0,
        showDots: false,
      });
    });

    return () => {
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
};
