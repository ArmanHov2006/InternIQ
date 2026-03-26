"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { CountUp } from "@/components/animations/CountUp";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { TextReveal } from "@/components/animations/TextReveal";
import { Marquee } from "@/components/magicui/marquee";

const stats = [
  { value: 10000, suffix: "+", label: "Applications Tracked" },
  { value: 2500, suffix: "+", label: "Portfolios Created" },
  { value: 85, suffix: "%", label: "Interview Rate Increase" },
  { value: 500, suffix: "+", label: "Universities" },
];

const testimonials = [
  {
    quote:
      "InternIQ completely transformed my job search. The Kanban board keeps me organized and the AI emails actually get responses.",
    author: "Sarah K., Stanford",
  },
  {
    quote:
      "I landed 3 internship interviews in my first week using InternIQ. The portfolio page is a game-changer.",
    author: "James T., MIT",
  },
  {
    quote:
      "Finally, a tool built for students. The fit scoring saved me hours of applying to wrong roles.",
    author: "Priya M., Columbia",
  },
];

const StatMetric = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  return (
    <ScrollReveal className="text-center sm:text-left">
      <motion.p
        className="text-4xl font-bold tracking-tight lg:text-5xl"
        initial={{ scale: 1 }}
        whileInView={{ scale: [1, 1.05, 1] }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.3, delay: 2 }}
      >
        <CountUp end={value} duration={2} />
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.2, delay: 2.2 }}
        >
          {suffix}
        </motion.span>
      </motion.p>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{label}</p>
    </ScrollReveal>
  );
};

export const SocialProof = () => {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-24 text-white dark:bg-slate-950 sm:px-6 lg:px-8 lg:py-36">
      <div className="pointer-events-none absolute inset-0 ambient-glow" />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-100 transition-opacity duration-1000" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="border-b border-white/10 pb-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:hidden">
            {stats.map((stat) => (
              <StatMetric key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} />
            ))}
          </div>
          <div className="hidden items-center justify-between lg:flex">
            {stats.map((stat, idx) => (
              <div key={stat.label} className="flex items-center">
                <StatMetric value={stat.value} suffix={stat.suffix} label={stat.label} />
                {idx < stats.length - 1 ? <div className="ml-10 h-12 w-px bg-white/10" /> : null}
              </div>
            ))}
          </div>
        </div>

        <TextReveal
          text="What Students Are Saying"
          as="h2"
          splitBy="words"
          className="mt-12 text-center text-4xl font-bold tracking-[-0.02em] leading-[1.1] sm:text-5xl lg:text-[56px]"
        />

        <div className="mt-10">
          <Marquee pauseOnHover repeat={3} className="[--duration:75s]">
            {testimonials.map((item) => (
              <div
                key={item.author}
                className="mx-2 w-[300px] shrink-0 rounded-xl border border-white/10 bg-slate-800/85 p-7"
              >
                <div className="mb-4 flex items-center gap-1 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star key={`${item.author}-${starIdx}`} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm italic leading-6 text-gray-200">{item.quote}</p>
                <p className="mt-4 text-sm font-semibold text-white">- {item.author}</p>
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
};
