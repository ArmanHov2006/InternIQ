"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Testimonial = {
  quote: string;
  author: string;
};

type Props = {
  testimonials: Testimonial[];
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TestimonialCarousel({ testimonials }: Props) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [testimonials.length]);

  const active = testimonials[index];

  return (
    <div className="w-full">
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.author}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -32 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ willChange: "transform, opacity" }}
            className="rounded-xl border border-white/10 bg-gray-800 p-6 text-white"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/30 text-sm font-bold">
                {initials(active.author)}
              </div>
              <p className="text-sm font-semibold">{active.author}</p>
            </div>
            <p className="text-sm leading-6 text-gray-200">{active.quote}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {testimonials.map((item, idx) => (
          <motion.div
            key={item.author}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08, duration: 0.45 }}
            style={{ willChange: "transform, opacity" }}
            className="rounded-xl border border-white/10 bg-gray-800 p-6 text-white"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/30 text-sm font-bold">
                {initials(item.author)}
              </div>
              <p className="text-sm font-semibold">{item.author}</p>
            </div>
            <p className="text-sm leading-6 text-gray-200">{item.quote}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2 md:hidden">
        {testimonials.map((item, dotIndex) => (
          <button
            key={item.author}
            type="button"
            onClick={() => setIndex(dotIndex)}
            className={`h-2.5 rounded-full transition-all ${
              dotIndex === index ? "w-6 bg-blue-400" : "w-2.5 bg-white/30"
            }`}
            aria-label={`Go to testimonial ${dotIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
