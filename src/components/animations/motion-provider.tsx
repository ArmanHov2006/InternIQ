"use client";

import { LazyMotion, domAnimation, MotionConfig, useReducedMotion } from "framer-motion";
import { useLenis } from "@/hooks/use-lenis";

interface MotionProviderProps {
  children: React.ReactNode;
}

export const MotionProvider = ({ children }: MotionProviderProps) => {
  useLenis();
  const reducedMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
};
