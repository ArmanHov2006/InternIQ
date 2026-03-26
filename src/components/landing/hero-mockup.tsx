"use client";

import { motion, useReducedMotion } from "framer-motion";

export function HeroMockup() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="pointer-events-none absolute inset-x-10 -bottom-8 -top-8 rounded-[28px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={reduceMotion ? undefined : { repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        style={{ willChange: "transform" }}
      >
        <div className="flex h-11 items-center gap-2 border-b border-border bg-muted/50 px-4">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <div className="ml-4 flex h-6 flex-1 items-center rounded-md border border-border bg-background px-3 text-xs text-muted-foreground">
            app.interniq.com/dashboard
          </div>
        </div>

        <div className="grid aspect-[16/10] min-h-[280px] grid-cols-[72px_1fr] bg-background sm:min-h-[340px] sm:grid-cols-[92px_1fr]">
          <aside className="border-r border-border bg-muted/40 p-3">
            <div className="mb-4 h-6 w-14 rounded bg-blue-500/20" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-7 rounded-md ${
                    idx === 0 ? "bg-blue-500/30" : "bg-foreground/10"
                  }`}
                />
              ))}
            </div>
          </aside>

          <div className="p-4">
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Internship Pipeline</h3>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["24", "Applications"],
                ["8", "Interviews"],
                ["3", "Offers"],
                ["67%", "Response Rate"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { title: "Saved", tone: "bg-blue-500/10 border-blue-500/20" },
                { title: "Applied", tone: "bg-amber-500/10 border-amber-500/20" },
                { title: "Interview", tone: "bg-purple-500/10 border-purple-500/20" },
              ].map((column) => (
                <div key={column.title} className={`rounded-lg border p-2 ${column.tone}`}>
                  <p className="mb-2 text-[10px] font-semibold text-foreground/80">{column.title}</p>
                  <div className="space-y-1.5">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="rounded-md border border-border bg-card px-2 py-1.5">
                        <div className="mb-1 h-2 w-3/4 rounded bg-foreground/20" />
                        <div className="h-1.5 w-1/2 rounded bg-foreground/10" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
