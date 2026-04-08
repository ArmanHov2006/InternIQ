"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowNudgeIcon, BrandMarkIcon, IconFrame } from "@/components/ui/icons/premium-icons";
import { Twitter, Github, Linkedin, Mail } from "lucide-react";

const productLinks = [
  { label: "Pipeline", href: "/dashboard/pipeline" },
  { label: "Settings", href: "/dashboard/settings" },
  { label: "Insights", href: "/dashboard/insights" },
  { label: "Dashboard", href: "/dashboard" },
];

const resourceLinks = [
  { label: "Documentation", href: "/docs" },
  { label: "Guides", href: "/guides" },
  { label: "Blog", href: "/blog" },
  { label: "Changelog", href: "/changelog" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Security", href: "/security" },
];

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/interniq", label: "Twitter" },
  { icon: Github, href: "https://github.com/interniq", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/company/interniq", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@interniq.app", label: "Email" },
];

export const Footer = () => {
  return (
    <footer className="relative border-t border-border px-4 py-16">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/[0.03] to-transparent" />
      
      <div className="relative mx-auto max-w-7xl">
        {/* Main footer content */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <IconFrame className="h-8 w-8 rounded-lg">
                <BrandMarkIcon />
              </IconFrame>
              <span className="font-display text-xl">InternIQ</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The premium career workspace for ambitious professionals. Track, analyze, and land your dream role.
            </p>
            
            {/* Social links */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  whileHover={{ y: -2 }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50"
                >
                  <social.icon className="h-4 w-4 text-muted-foreground" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <p className="text-sm font-semibold">Resources</p>
            <ul className="mt-4 space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <p className="text-sm font-semibold">Legal</p>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} InternIQ. All rights reserved.
          </p>
          <motion.div whileHover={{ x: 4 }}>
            <Link 
              href="/dashboard" 
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              Open app
              <ArrowNudgeIcon className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};
