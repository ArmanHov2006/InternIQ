"use client";

import { GlassCard } from "@/components/ui/glass-card";

const testimonials = [
  "InternIQ turned my job search into a system.",
  "The tracker + AI stack is unfairly good.",
  "My public profile started getting recruiter replies in days.",
  "Kanban flow feels smooth and addictive.",
  "I actually enjoy updating applications now.",
  "Finally a job-search tool that feels premium.",
];

export const TestimonialsSection = () => {
  const marquee = [...testimonials, ...testimonials];
  return (
    <section id="testimonials" className="px-4 py-20">
      <div className="mx-auto max-w-7xl overflow-hidden">
        <div className="flex w-max gap-4 pb-4 animate-marquee">
          {marquee.map((quote, index) => (
            <GlassCard key={`${quote}-${index}`} className="min-w-[320px] p-6">
              <p className="text-sm text-yellow-300">★★★★★</p>
              <p className="mt-3">{quote}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Member #{index + 1} · Job seeker
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};
