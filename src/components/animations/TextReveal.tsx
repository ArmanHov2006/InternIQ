"use client";

import { useEffect, useMemo, useRef } from "react";
import { initGsap, gsap } from "@/lib/gsap-config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type RevealTag = "h1" | "h2" | "h3" | "p" | "span";
type TriggerMode = "scroll" | "load";
type SplitMode = "chars" | "words" | "lines";

interface TextRevealProps {
  text: string;
  as?: RevealTag;
  trigger?: TriggerMode;
  splitBy?: SplitMode;
  staggerDelay?: number;
  className?: string;
}

const splitText = (text: string, splitBy: SplitMode) => {
  if (splitBy === "chars") {
    return text.split("").map((item) => (item === " " ? "\u00A0" : item));
  }
  if (splitBy === "lines") {
    return text.split("\n");
  }
  return text.split(/(\s+)/).map((item) => (item === " " ? "\u00A0" : item));
};

export const TextReveal = ({
  text,
  as = "p",
  trigger = "scroll",
  splitBy = "words",
  staggerDelay,
  className,
}: TextRevealProps) => {
  const rootRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const parts = useMemo(() => splitText(text, splitBy), [text, splitBy]);

  useEffect(() => {
    initGsap();
    if (!rootRef.current || reducedMotion) {
      return;
    }

    const duration = splitBy === "chars" ? 1 : splitBy === "words" ? 0.8 : 0.6;
    const stagger =
      staggerDelay ?? (splitBy === "chars" ? 0.03 : splitBy === "words" ? 0.08 : 0.12);
    const inner = rootRef.current.querySelectorAll("[data-inner]");
    const tween = gsap.to(inner, {
      y: "0%",
      opacity: 1,
      duration,
      ease: "power4.out",
      stagger,
      scrollTrigger:
        trigger === "scroll"
          ? {
              trigger: rootRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            }
          : undefined,
      delay: trigger === "load" ? 0 : undefined,
    });

    return () => {
      tween.kill();
    };
  }, [splitBy, staggerDelay, trigger, reducedMotion]);

  const Tag = as;

  return (
    <Tag ref={rootRef as never} className={className}>
      {parts.map((part, index) => (
        <span
          key={`${part}-${index}`}
          className="inline-block overflow-hidden align-bottom"
          data-part
        >
          <span
            data-inner
            className="inline-block translate-y-[110%] opacity-0 will-change-transform"
          >
            {part}
          </span>
        </span>
      ))}
    </Tag>
  );
};
