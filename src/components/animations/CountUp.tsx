"use client";

import { useEffect, useRef } from "react";
import { initGsap, gsap } from "@/lib/gsap-config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const CountUp = ({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    initGsap();
    if (!ref.current || reducedMotion) {
      if (ref.current) {
        ref.current.textContent = `${prefix}${end.toFixed(decimals)}${suffix}`;
      }
      return;
    }

    const proxy = { val: 0 };
    const tween = gsap.to(proxy, {
      val: end,
      duration,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 80%",
      },
      onUpdate: () => {
        if (!ref.current) {
          return;
        }
        ref.current.textContent = `${prefix}${proxy.val.toFixed(decimals)}${suffix}`;
      },
    });

    return () => {
      tween.kill();
    };
  }, [end, duration, prefix, suffix, decimals, reducedMotion]);

  return <span ref={ref} className={className} />;
};
