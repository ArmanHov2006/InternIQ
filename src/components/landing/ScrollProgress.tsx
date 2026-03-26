"use client";

import { useEffect, useRef } from "react";
import { initGsap, gsap } from "@/lib/gsap-config";

export const ScrollProgress = () => {
  const lineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initGsap();
    if (!lineRef.current) {
      return;
    }

    const tween = gsap.fromTo(
      lineRef.current,
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      }
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px] bg-blue-500 dark:bg-blue-400" ref={lineRef} />
  );
};
