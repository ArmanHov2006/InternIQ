"use client";

import { AnimatedAccordion } from "@/components/animations/AnimatedAccordion";
import { StaggerChildren, StaggerItem } from "@/components/animations/StaggerChildren";
import { TextReveal } from "@/components/animations/TextReveal";

const items = [
  {
    question: "Is InternIQ free to use?",
    answer:
      "Yes! InternIQ is completely free for students. We believe every student deserves access to professional tools for their job search.",
  },
  {
    question: "How does the AI cold email generator work?",
    answer:
      "Our AI analyzes the role you're applying for and your profile to generate personalized, professional outreach emails. Just review, customize, and send.",
  },
  {
    question: "Can employers see my profile?",
    answer:
      "Your public portfolio page is visible to anyone with the link — perfect for sharing with recruiters. Your private data (applications, resumes, notes) is protected by row-level security and never shared.",
  },
  {
    question: "What file formats do you support for resumes?",
    answer:
      "We currently support PDF uploads. Our parser automatically extracts text, skills, and experience from your resume for analysis.",
  },
  {
    question: "How do I get started?",
    answer:
      "Sign up in 30 seconds — no credit card required. Create your profile, start tracking applications, and build your public portfolio right away.",
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="bg-background px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            FAQ
          </span>
          <TextReveal
            text="Frequently Asked Questions"
            as="h2"
            splitBy="words"
            className="text-4xl font-bold tracking-[-0.02em] leading-[1.1] text-foreground sm:text-5xl lg:text-[56px]"
          />
        </div>
        <StaggerChildren className="mt-12" staggerDelay={0.08}>
          <StaggerItem>
            <AnimatedAccordion items={items} />
          </StaggerItem>
        </StaggerChildren>
      </div>
    </section>
  );
};
