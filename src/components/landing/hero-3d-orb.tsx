"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export function Hero3DOrb() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 100 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="relative flex h-[420px] w-full items-center justify-center sm:h-[500px] lg:h-[600px]"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      <div className="absolute inset-0 -z-10">
        <div className="animate-gradient absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[150px] sm:h-[500px] sm:w-[500px]" />
        <div
          className="animate-gradient absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/15 blur-[130px] sm:h-[400px] sm:w-[400px]"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 1200, willChange: "transform" }}
        className="relative"
      >
        <motion.div
          className="relative h-52 w-52 rounded-full sm:h-56 sm:w-56 lg:h-72 lg:w-72"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            background: "conic-gradient(from 0deg, #3B82F6, #8B5CF6, #EC4899, #3B82F6)",
          }}
        >
          <div className="absolute inset-2 rounded-full bg-background/90 backdrop-blur-xl" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm" />
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/20 sm:h-80 sm:w-80 lg:h-96 lg:w-96"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: "preserve-3d", transform: "rotateX(70deg)" }}
        >
          <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500/15 sm:h-[350px] sm:w-[350px] lg:h-[420px] lg:w-[420px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: "preserve-3d", transform: "rotateX(60deg) rotateY(20deg)" }}
        >
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
