"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const TopLoader = () => {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timer = window.setTimeout(() => setActive(false), 420);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed left-0 right-0 top-0 z-[120] h-[2px] bg-gradient-to-r from-primary via-accent to-accent-warm"
          initial={{ scaleX: 0, opacity: 0.85 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "0% 50%" }}
        />
      ) : null}
    </AnimatePresence>
  );
};
