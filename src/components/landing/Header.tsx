"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness } from "lucide-react";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { initGsap, gsap } from "@/lib/gsap-config";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#faq", label: "FAQ" },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const logoRef = useRef<HTMLAnchorElement | null>(null);

  const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const target = document.querySelector(href);
    if (!target) {
      return;
    }
    if (window.__lenis) {
      window.__lenis.scrollTo(target as HTMLElement);
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    initGsap();
    if (!logoRef.current) {
      return;
    }

    const tween = gsap.to(logoRef.current, {
      scale: 0.9,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "100vh top",
        scrub: 0.5,
      },
    });

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <motion.header
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-border/70 bg-background/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" ref={logoRef} className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
          <BriefcaseBusiness className="h-6 w-6 text-blue-500" />
          InternIQ
        </Link>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { delayChildren: 0.5, staggerChildren: 0.05 } },
          }}
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              onClick={(event) => handleAnchorClick(event, link.href)}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-cursor="interactive"
            >
              {link.label}
            </motion.a>
          ))}
        </motion.div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" data-cursor="interactive">
            Log In
          </Link>
          <MagneticButton strength={0.3}>
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
              data-cursor="cta"
              data-cursor-label="Start"
            >
              Get Started Free
            </Link>
          </MagneticButton>
        </div>
      </nav>
    </motion.header>
  );
};
