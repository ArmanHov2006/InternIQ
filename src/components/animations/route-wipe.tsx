"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";

const pageSurfaceColor = (path: string) => {
  if (path.startsWith("/dashboard")) {
    return "#111827";
  }

  if (path.startsWith("/login") || path.startsWith("/signup")) {
    return "#2563EB";
  }

  return "#0F2440";
};

export const RouteWipe = () => {
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const previousPathnameRef = useRef(pathname);
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Keep Barba loaded for transition orchestration compatibility.
    import("@barba/core").then((barbaModule) => {
      barbaModule.default?.hooks?.after?.(() => undefined);
    });
  }, []);

  useEffect(() => {
    if (!overlayRef.current) {
      return;
    }

    if (!isMountedRef.current) {
      isMountedRef.current = true;
      previousPathnameRef.current = pathname;
      return;
    }

    if (prefersReducedMotion()) {
      previousPathnameRef.current = pathname;
      return;
    }

    const node = overlayRef.current;
    node.style.backgroundColor = pageSurfaceColor(pathname);

    let first: { cancel?: () => void } | null = null;
    import("animejs").then(({ animate }) => {
      first = animate(node, {
        clipPath: [
          "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)",
          "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        ],
        ease: "inOutCubic",
        duration: 430,
        onComplete: () => {
          animate(node, {
            clipPath: [
              "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
              "polygon(0 0, 100% 0, 100% 0, 0 0)",
            ],
            ease: "inOutCubic",
            duration: 430,
          });
        },
      });
    });

    previousPathnameRef.current = pathname;

    return () => {
      first?.cancel?.();
    };
  }, [pathname]);

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[120] [clip-path:polygon(0_100%,100%_100%,100%_100%,0_100%)]"
    />
  );
};
