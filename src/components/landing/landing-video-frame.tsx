"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LandingVideoFrameProps {
  webm: string;
  mp4?: string;
  poster: string;
  fallback?: ReactNode;
  className?: string;
  mediaClassName?: string;
}

export const LandingVideoFrame = ({
  webm,
  mp4,
  poster,
  fallback,
  className,
  mediaClassName,
}: LandingVideoFrameProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card via-card/90 to-muted/40",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent" />
      {fallback ? <div className="absolute inset-0">{fallback}</div> : null}

      {prefersReducedMotion ? (
        !imageFailed ? (
          <Image
            src={poster}
            alt=""
            fill
            sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
            className={cn("relative z-10 object-cover", mediaClassName)}
            onError={() => setImageFailed(true)}
          />
        ) : null
      ) : !videoFailed ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          onCanPlay={() => setVideoReady(true)}
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className={cn(
            "relative z-10 h-full w-full object-cover transition-opacity duration-300",
            videoReady ? "opacity-100" : "opacity-0",
            mediaClassName
          )}
        >
          <source src={webm} type="video/webm" />
          {mp4 ? <source src={mp4} type="video/mp4" /> : null}
        </video>
      ) : null}
    </div>
  );
};
