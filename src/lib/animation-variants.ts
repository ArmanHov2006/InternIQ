import { Variants } from "framer-motion";

export const fadeUpChild: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const staggerContainer = (staggerDelay = 0.1): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export const cardHover: Variants = {
  rest: { y: 0, scale: 1, boxShadow: "0 8px 24px rgba(15, 36, 64, 0.05)" },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: "0 22px 48px rgba(15, 36, 64, 0.14)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};
