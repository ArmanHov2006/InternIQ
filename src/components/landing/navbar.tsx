"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { BrandMarkIcon, IconFrame } from "@/components/ui/icons/premium-icons";

const links = ["Features", "Stats", "Testimonials"];

export const Navbar = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (current < 64) {
      setHidden(false);
      return;
    }
    setHidden(current > previous);
  });

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: hidden ? -110 : 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <nav className="glass-strong mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl px-4">
        <Link href="/" className="inline-flex items-center gap-2" data-cursor="pointer">
          <IconFrame className="h-7 w-7 rounded-md">
            <BrandMarkIcon />
          </IconFrame>
          <span className="font-display text-xl">InternIQ</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="group text-sm text-muted-foreground"
              data-cursor="pointer"
              aria-label={`Jump to ${link}`}
            >
              {link}
              <span className="mt-1 block h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <MagneticButton asChild variant="ghost" size="sm">
            <Link href="/login">Sign In</Link>
          </MagneticButton>
          <MagneticButton asChild size="sm" className="glow-sm">
            <Link href="/signup">Get Started</Link>
          </MagneticButton>
        </div>
      </nav>
    </motion.header>
  );
};
