"use client";

import { useEffect, useMemo, useRef } from "react";
import { setupGsap } from "@/components/animations/gsap";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";
import { cn } from "@/lib/utils";

interface GsapSplitHeadingProps {
  text: string;
  className?: string;
}

export const GsapSplitHeading = ({ text, className }: GsapSplitHeadingProps) => {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const chars = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    if (!headingRef.current || prefersReducedMotion()) {
      return;
    }

    const gsap = setupGsap();
    const charsNodes = headingRef.current.querySelectorAll("[data-char]");
    const tween = gsap.fromTo(
      charsNodes,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: "power2.out",
        duration: 0.45,
        stagger: 0.012,
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 86%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <h2 ref={headingRef} className={cn(className)}>
      {chars.map((char, index) => (
        <span
          key={`${char}-${index}`}
          data-char
          className={char === " " ? "inline-block w-[0.35em]" : "inline-block"}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h2>
  );
};
