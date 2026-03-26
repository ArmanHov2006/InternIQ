"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type SplineAccentProps = {
  sceneUrl: string;
  className?: string;
};

export function SplineAccent({ sceneUrl, className }: SplineAccentProps) {
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const sceneId = sceneUrl.match(/prod\.spline\.design\/([^/]+)\//)?.[1] ?? "";
  const embedUrl = sceneId ? `https://my.spline.design/${sceneId}/` : "";

  return (
    <motion.div
      className={`pointer-events-none absolute right-[-16%] top-[-26%] z-0 h-[420px] w-[420px] sm:right-[-10%] sm:top-[-22%] sm:h-[520px] sm:w-[520px] lg:right-[-4%] lg:top-[-28%] lg:h-[680px] lg:w-[680px] ${className ?? ""}`}
      initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      style={{
        maskImage:
          "radial-gradient(circle at 30% 55%, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.5) 58%, transparent 85%)",
        WebkitMaskImage:
          "radial-gradient(circle at 30% 55%, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.5) 58%, transparent 85%)",
      }}
    >
      <div className="absolute inset-0">
        <div className="animate-gradient absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/25 blur-[120px]" />
        <div
          className="animate-gradient absolute left-1/3 top-1/3 h-2/3 w-2/3 rounded-full bg-purple-500/20 blur-[100px]"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="animate-gradient absolute bottom-1/4 right-1/4 h-1/2 w-1/2 rounded-full bg-cyan-500/15 blur-[90px]"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-44 w-44 animate-pulse rounded-full bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-cyan-500/20 blur-xl" />
        </div>
      ) : null}

      {mounted && embedUrl ? (
        <div className="relative h-full w-full opacity-75 dark:opacity-90">
          <iframe
            title="InternIQ 3D Accent"
            src={embedUrl}
            className="h-full w-full border-0"
            loading="eager"
            onLoad={() => setReady(true)}
            allow="fullscreen"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,transparent_12%,rgba(2,6,23,0.42)_72%,rgba(2,6,23,0.65)_100%)]" />
        </div>
      ) : null}
    </motion.div>
  );
}

export function SplineHero({ sceneUrl }: { sceneUrl: string }) {
  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-border/50 bg-card/40 sm:h-[420px] lg:h-[520px]">
      <SplineAccent sceneUrl={sceneUrl} className="right-[-4%] top-[-6%] sm:right-[-2%] sm:top-[-12%]" />
    </div>
  );
}
