"use client";

import { ChevronDown } from "lucide-react";
import { GsapSplitHeading } from "@/components/animations/gsap-split-heading";
import { GsapStaggerReveal } from "@/components/animations/gsap-stagger-reveal";

const sectionBadgeClasses =
  "mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700";

const faqs = [
  {
    question: "Is InternIQ free to use?",
    answer: "Yes. InternIQ is free forever for students, with no credit card required.",
  },
  {
    question: "How does the AI cold email generator work?",
    answer:
      "It uses your profile and target role context to draft personalized outreach you can edit and send quickly.",
  },
  {
    question: "Can employers see my profile?",
    answer:
      "Your public profile is shareable, but private dashboard data remains protected with secure access controls.",
  },
  {
    question: "What file formats do you support for resumes?",
    answer: "PDF uploads are supported with automatic field extraction and parsing.",
  },
  {
    question: "How do I get started?",
    answer: "Create your account in about 30 seconds and start tracking right away.",
  },
];

export const FaqSection = () => {
  return (
    <section id="faq" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-3xl">
        <GsapStaggerReveal className="text-center">
          <span data-reveal-item className={sectionBadgeClasses}>
            FAQ
          </span>
          <GsapSplitHeading
            text="Frequently Asked Questions"
            className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl"
          />
        </GsapStaggerReveal>
        <GsapStaggerReveal className="mt-10 divide-y divide-[#E5E7EB] rounded-xl border border-[#E5E7EB]">
          {faqs.map((item) => (
            <details key={item.question} data-reveal-item className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-left text-base font-semibold text-[#111827]">
                  {item.question}
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-[#6B7280] transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 pr-8 text-sm leading-6 text-[#6B7280]">{item.answer}</p>
            </details>
          ))}
        </GsapStaggerReveal>
      </div>
    </section>
  );
};
