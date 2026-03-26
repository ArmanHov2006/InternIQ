"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const themeCycle = ["system", "light", "dark"] as const;

export function ThemeToggle() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" aria-label="Toggle theme mode" />;
  }

  const activeTheme = theme ?? "system";
  const iconKey = activeTheme === "system" ? `system-${resolvedTheme ?? "light"}` : activeTheme;

  const icon =
    activeTheme === "system" ? (
      <Monitor className="h-4 w-4" />
    ) : activeTheme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  const handleCycleTheme = () => {
    const index = themeCycle.indexOf(activeTheme as (typeof themeCycle)[number]);
    const next = themeCycle[(index + 1) % themeCycle.length];
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCycleTheme}
      className="h-9 w-9 rounded-lg"
      aria-label="Toggle theme mode"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={iconKey}
          initial={reduceMotion ? { opacity: 0 } : { rotate: -120, opacity: 0, scale: 0.8 }}
          animate={reduceMotion ? { opacity: 1 } : { rotate: 0, opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { rotate: 120, opacity: 0, scale: 0.8 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.25, ease: "easeOut" }}
        >
          {icon}
        </motion.div>
      </AnimatePresence>
    </Button>
  );
}
