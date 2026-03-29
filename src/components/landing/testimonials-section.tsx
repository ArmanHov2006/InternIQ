"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionReveal } from "@/components/ui/section-reveal";
import { GradientText } from "@/components/ui/gradient-text";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "InternIQ turned my chaotic job search into a streamlined system. I landed 3 interviews in my first week.",
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Google",
    avatar: "SC",
  },
  {
    quote: "The AI resume analysis caught issues I never would have noticed. My response rate jumped 40%.",
    name: "Marcus Johnson",
    role: "Product Manager",
    company: "Meta",
    avatar: "MJ",
  },
  {
    quote: "Finally a job tracking tool that feels as premium as the companies I am applying to.",
    name: "Emily Rodriguez",
    role: "UX Designer",
    company: "Stripe",
    avatar: "ER",
  },
  {
    quote: "The kanban board is addictive. I actually enjoy updating my applications now.",
    name: "David Kim",
    role: "Data Scientist",
    company: "Netflix",
    avatar: "DK",
  },
  {
    quote: "My public profile started getting recruiter messages within days of publishing.",
    name: "Amanda Foster",
    role: "Marketing Lead",
    company: "Airbnb",
    avatar: "AF",
  },
  {
    quote: "The cold email generator saved me hours. Personalized outreach in seconds.",
    name: "James Liu",
    role: "Frontend Dev",
    company: "Vercel",
    avatar: "JL",
  },
];

const TestimonialCard = ({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
  >
    <GlassCard className="group relative min-w-[340px] max-w-[340px] p-6 transition-all hover:border-white/20 hover:shadow-glow-sm">
      {/* Quote icon */}
      <div className="absolute -top-3 -left-2 rounded-full bg-primary/20 p-2">
        <Quote className="h-4 w-4 text-primary" />
      </div>
      
      {/* Stars */}
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      
      {/* Quote */}
      <p className="mt-4 text-sm leading-relaxed text-foreground/90">{testimonial.quote}</p>
      
      {/* Author */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-accent/40 text-xs font-semibold">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-medium">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">
            {testimonial.role} at <span className="text-primary">{testimonial.company}</span>
          </p>
        </div>
      </div>
    </GlassCard>
  </motion.div>
);

export const TestimonialsSection = () => {
  const marqueeTop = [...testimonials, ...testimonials];
  const marqueeBottom = [...testimonials.reverse(), ...testimonials.reverse()];

  return (
    <section id="testimonials" className="relative overflow-hidden py-20 sm:py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Section header */}
      <div className="mx-auto max-w-7xl px-4 text-center">
        <SectionReveal>
          <span className="glass inline-flex rounded-full px-4 py-1.5 text-sm font-medium">
            Testimonials
          </span>
        </SectionReveal>
        <SectionReveal delay={0.1}>
          <h2 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl">
            <GradientText>Loved by Job Seekers</GradientText>
          </h2>
        </SectionReveal>
        <SectionReveal delay={0.2}>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of professionals who transformed their job search with InternIQ.
          </p>
        </SectionReveal>
      </div>

      {/* Marquee rows */}
      <div className="mt-12 space-y-4">
        {/* Row 1 - Left to right */}
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />
          <motion.div 
            className="flex gap-4"
            animate={{ x: [0, -1920] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {marqueeTop.map((testimonial, index) => (
              <TestimonialCard key={`top-${index}`} testimonial={testimonial} index={index} />
            ))}
          </motion.div>
        </div>

        {/* Row 2 - Right to left */}
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />
          <motion.div 
            className="flex gap-4"
            animate={{ x: [-1920, 0] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          >
            {marqueeBottom.map((testimonial, index) => (
              <TestimonialCard key={`bottom-${index}`} testimonial={testimonial} index={index} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
