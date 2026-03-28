"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useMagnetic } from "@/hooks/use-magnetic";

interface MagneticButtonProps extends ButtonProps {
  strength?: number;
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ strength = 22, children, ...props }, ref) => {
    const { x, y, onMouseMove, onMouseLeave } = useMagnetic(strength);

    return (
      <motion.div
        data-cursor="pointer"
        style={{ x, y }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        whileTap={{ scale: 0.97 }}
      >
        <Button ref={ref} {...props}>
          {children}
        </Button>
      </motion.div>
    );
  }
);

MagneticButton.displayName = "MagneticButton";
