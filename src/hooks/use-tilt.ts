"use client";

import { useMemo } from "react";
import { MotionValue, useSpring, useMotionValue } from "framer-motion";
import type { MouseEvent } from "react";

interface TiltResult {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  onMouseMove: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
}

export const useTilt = (max = 5): TiltResult => {
  const baseX = useMotionValue(0);
  const baseY = useMotionValue(0);

  const rotateX = useSpring(baseX, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(baseY, { stiffness: 300, damping: 30 });

  const handlers = useMemo<TiltResult>(
    () => ({
      rotateX,
      rotateY,
      onMouseMove: (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        baseX.set((0.5 - py) * max * 2);
        baseY.set((px - 0.5) * max * 2);
      },
      onMouseLeave: () => {
        baseX.set(0);
        baseY.set(0);
      },
    }),
    [baseX, baseY, max, rotateX, rotateY]
  );

  return handlers;
};
