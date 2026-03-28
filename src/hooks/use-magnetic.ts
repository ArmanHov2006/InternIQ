"use client";

import { useMemo } from "react";
import { MotionValue, useMotionValue, useSpring } from "framer-motion";
import type { MouseEvent } from "react";

interface MagneticResult {
  x: MotionValue<number>;
  y: MotionValue<number>;
  onMouseMove: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
}

export const useMagnetic = (strength = 28): MagneticResult => {
  const baseX = useMotionValue(0);
  const baseY = useMotionValue(0);
  const x = useSpring(baseX, { stiffness: 300, damping: 30 });
  const y = useSpring(baseY, { stiffness: 300, damping: 30 });

  return useMemo(
    () => ({
      x,
      y,
      onMouseMove: (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const offsetX = event.clientX - (rect.left + rect.width / 2);
        const offsetY = event.clientY - (rect.top + rect.height / 2);
        baseX.set((offsetX / rect.width) * strength);
        baseY.set((offsetY / rect.height) * strength);
      },
      onMouseLeave: () => {
        baseX.set(0);
        baseY.set(0);
      },
    }),
    [baseX, baseY, strength, x, y]
  );
};
