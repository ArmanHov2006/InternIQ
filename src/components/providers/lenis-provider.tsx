"use client";

import { useEffect } from "react";
import Lenis from "lenis";

interface LenisProviderProps {
  children: React.ReactNode;
}

export const LenisProvider = ({ children }: LenisProviderProps) => {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, lerp: 0.08, smoothWheel: true });
    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
};
