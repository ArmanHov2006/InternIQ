"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container";
import { TiltCard } from "@/components/motion/tilt-card";

type Testimonial = {
  quote: string;
  author: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TestimonialSection({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [shouldReduceMotion, testimonials.length]);

  return (
    <div>
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonials[index].author}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/15 bg-gray-800 p-6"
          >
            <div className="mb-3 flex gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-sm leading-6 text-gray-100">{testimonials[index].quote}</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/25 text-xs font-bold text-white">
                {initials(testimonials[index].author)}
              </span>
              <span className="text-sm font-semibold text-white">{testimonials[index].author}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <StaggerContainer className="hidden gap-5 md:grid md:grid-cols-3" staggerChildren={0.08}>
        {testimonials.map((item) => (
          <StaggerItem key={item.author}>
            <FadeIn direction="up">
              <TiltCard className="rounded-2xl border border-white/15 bg-gray-800 p-6">
                <div className="mb-3 flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-6 text-gray-100">{item.quote}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/25 text-xs font-bold text-white">
                    {initials(item.author)}
                  </span>
                  <span className="text-sm font-semibold text-white">{item.author}</span>
                </div>
              </TiltCard>
            </FadeIn>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
