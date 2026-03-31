"use client";

import { motion, useSpring } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { cn } from "@/lib/utils";

type CursorMode = "default" | "pointer" | "text" | "drag";

export const CustomCursor = () => {
  const mouse = useMousePosition();
  const [mode, setMode] = useState<CursorMode>("default");

  const x = useSpring(mouse.x, { stiffness: 350, damping: 35 });
  const y = useSpring(mouse.y, { stiffness: 350, damping: 35 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const cursorAttr = target?.closest("[data-cursor]")?.getAttribute("data-cursor");
      if (cursorAttr === "pointer" || cursorAttr === "text" || cursorAttr === "drag") {
        setMode(cursorAttr);
        return;
      }
      setMode("default");
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const modeClass = useMemo(() => {
    if (mode === "pointer") return "h-12 w-12 border-primary/60";
    if (mode === "text") return "h-10 w-1 rounded-full border-accent/70";
    if (mode === "drag") return "h-10 w-10 border-accent-warm/70";
    return "h-8 w-8 border-white/40";
  }, [mode]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden md:block"
      style={{ x, y }}
      aria-hidden
    >
      <div
        className={cn(
          "-translate-x-1/2 -translate-y-1/2 rounded-full border bg-white/[0.03] backdrop-blur-sm transition-all duration-200",
          modeClass
        )}
      />
      <style jsx>{`
        @media (pointer: coarse) {
          div {
            display: none;
          }
        }
      `}</style>
    </motion.div>
  );
};
