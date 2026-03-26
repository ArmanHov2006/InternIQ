"use client";

import { motion } from "framer-motion";
import { BriefcaseBusiness, Github, Linkedin, Twitter } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StaggerChildren, StaggerItem } from "@/components/animations/StaggerChildren";
import { initGsap, gsap } from "@/lib/gsap-config";
import { useEffect, useRef } from "react";

const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#faq", label: "FAQ" },
];
const companyLinks = [
  { href: "#", label: "About" },
  { href: "#", label: "Blog" },
  { href: "#", label: "Careers" },
];
const legalLinks = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
];

export const Footer = () => {
  const lineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initGsap();
    if (!lineRef.current) {
      return;
    }
    const tween = gsap.fromTo(
      lineRef.current,
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        scrollTrigger: {
          trigger: lineRef.current,
          start: "top 95%",
          end: "bottom 70%",
          scrub: 1,
        },
      }
    );
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <footer className="bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="inline-flex items-center gap-2 text-lg font-bold">
                <BriefcaseBusiness className="h-5 w-5 text-blue-400" />
                InternIQ
              </div>
              <p className="mt-4 text-sm text-gray-400">Track, build, and stand out.</p>
            </div>
            <StaggerChildren staggerDelay={0.05}>
              <StaggerItem>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Product</h3>
                <ul className="mt-4 space-y-2 text-sm text-gray-400">
                  {productLinks.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="transition-all duration-200 hover:translate-x-1 hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            </StaggerChildren>
            <StaggerChildren staggerDelay={0.05}>
              <StaggerItem>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Company</h3>
                <ul className="mt-4 space-y-2 text-sm text-gray-400">
                  {companyLinks.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="transition-all duration-200 hover:translate-x-1 hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            </StaggerChildren>
            <StaggerChildren staggerDelay={0.05}>
              <StaggerItem>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Legal</h3>
                <ul className="mt-4 space-y-2 text-sm text-gray-400">
                  {legalLinks.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="transition-all duration-200 hover:translate-x-1 hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            </StaggerChildren>
          </div>

          <div ref={lineRef} className="mt-10 h-px w-full bg-white/10" />

          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-400">© 2026 InternIQ. All rights reserved.</p>
            <div className="flex items-center gap-3">
              {[Twitter, Linkedin, Github].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                  className="text-gray-400 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
};
