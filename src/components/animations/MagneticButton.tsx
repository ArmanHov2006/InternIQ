"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export const MagneticButton = ({
  children,
  strength = 0.3,
  className,
}: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * rect.width * strength;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * rect.height * strength;
    ref.current.style.setProperty("--mx", `${x}px`);
    ref.current.style.setProperty("--my", `${y}px`);
  };

  const onLeave = () => {
    if (!ref.current) {
      return;
    }
    ref.current.style.setProperty("--mx", "0px");
    ref.current.style.setProperty("--my", "0px");
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      style={{ x: "var(--mx)", y: "var(--my)" }}
    >
      <motion.div style={{ x: "calc(var(--mx) * 1.5)", y: "calc(var(--my) * 1.5)" }}>
        {children}
      </motion.div>
    </motion.div>
  );
};
