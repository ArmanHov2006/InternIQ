"use client";

import { FileUp, GripVertical, Moon, Search, ShieldCheck, Target } from "lucide-react";
import { motion } from "framer-motion";
import { TextReveal } from "@/components/animations/TextReveal";
import { StaggerChildren, StaggerItem } from "@/components/animations/StaggerChildren";
import { TiltCard } from "@/components/animations/TiltCard";

const features = [
  {
    icon: GripVertical,
    title: "Drag & Drop",
    description: "Intuitive Kanban board with drag-and-drop to move applications between stages.",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    description: "Easy on the eyes. Toggle between light and dark themes.",
  },
  {
    icon: FileUp,
    title: "Resume Upload",
    description: "Upload PDFs and get them automatically parsed and analyzed.",
  },
  {
    icon: Target,
    title: "Fit Scoring",
    description: "AI-powered matching tells you how well you fit each role.",
  },
  {
    icon: Search,
    title: "SEO-Optimized Profile",
    description: "Server-rendered public profile that ranks on Google.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Default",
    description: "Row-level security ensures your private data stays private.",
  },
];

export const SecondaryFeatures = () => {
  return (
    <section className="bg-background px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <span className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            Everything You Need
          </span>
          <TextReveal
            text="Built for the Modern Job Seeker"
            as="h2"
            splitBy="words"
            className="text-4xl font-bold tracking-[-0.02em] leading-[1.1] text-foreground sm:text-5xl lg:text-[56px]"
          />
        </div>
        <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <TiltCard maxTilt={8} className="h-full">
                <motion.div
                  className="group h-full rounded-xl border border-border bg-muted/35 p-7 transition-colors hover:border-blue-200 dark:hover:border-blue-500/40"
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20"
                    initial={{ scale: 0, rotate: 0 }}
                    whileInView={{ scale: 1, rotate: 360 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
                  >
                    <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </motion.div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};
