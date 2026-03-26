"use client";

import { useEffect, useState } from "react";
import Spline from "@splinetool/react-spline";
import { Skeleton } from "@/components/ui/skeleton";
import { LANDING_SPLINE_SCENE_URL } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const SCENE_TIMEOUT_MS = 9000;

export function HeroSpline() {
  const reduceMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [renderScene, setRenderScene] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    setLoaded(false);
    setTimedOut(false);
    setRenderScene(false);
    const mountTimer = window.setTimeout(() => {
      setRenderScene(true);
    }, 180);
    const timer = window.setTimeout(() => {
      setTimedOut(true);
    }, SCENE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(mountTimer);
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <div className="h-full w-full">
        <div className="absolute left-[8%] top-[12%] h-48 w-48 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute right-[10%] top-[24%] h-56 w-56 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute bottom-[8%] left-[30%] h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/20" />
      </div>
    );
  }

  if (timedOut && !loaded) {
    return (
      <div className="h-full w-full">
        <div className="absolute left-[12%] top-[18%] h-44 w-44 rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute right-[14%] top-[28%] h-52 w-52 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute bottom-[10%] left-[35%] h-40 w-40 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/20" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!loaded ? (
        <div className="pointer-events-none absolute inset-0 z-20 p-4">
          <Skeleton className="h-full w-full rounded-3xl bg-white/30 dark:bg-white/10" />
        </div>
      ) : null}

      <div className="h-full w-full">
        <div className="pointer-events-none h-full w-full">
          {renderScene ? (
            <Spline
              scene={LANDING_SPLINE_SCENE_URL}
              onLoad={() => {
                setLoaded(true);
                setTimedOut(false);
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
