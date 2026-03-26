"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AnalyzerGlyph,
  BrandMarkIcon,
  IconFrame,
  MailGlyph,
  MoonGlyph,
  OverviewGlyph,
  ProfileGlyph,
  SunGlyph,
  TrackerGlyph,
} from "@/components/ui/icons/premium-icons";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const dashboardNavItems = [
  { href: "/dashboard", label: "Overview", icon: OverviewGlyph },
  { href: "/dashboard/tracker", label: "Tracker", icon: TrackerGlyph },
  { href: "/dashboard/profile", label: "Profile", icon: ProfileGlyph },
  { href: "/dashboard/analyze", label: "AI Analyzer", icon: AnalyzerGlyph },
  { href: "/dashboard/email", label: "Cold Email", icon: MailGlyph },
];

export const Sidebar = ({ collapsed, onToggleCollapse }: SidebarProps) => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className={cn("glass-strong fixed inset-y-4 left-4 z-40 hidden rounded-2xl p-3 md:block", collapsed ? "w-16" : "w-72")}>
      <div className="flex h-full flex-col">
        <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-2" data-cursor="pointer">
          <IconFrame className="h-7 w-7 rounded-md">
            <BrandMarkIcon />
          </IconFrame>
          {!collapsed ? <span className="font-display text-xl">InternIQ</span> : null}
        </Link>

        <nav className="space-y-1">
          {dashboardNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm", active ? "text-white" : "text-muted-foreground hover:text-white")}
              >
                {active ? <motion.span layoutId="active-pill" className="absolute inset-0 rounded-xl bg-primary/20" /> : null}
                <IconFrame className="relative z-10 h-6 w-6 rounded-md border-white/10 bg-white/[0.03]">
                  <item.icon />
                </IconFrame>
                {!collapsed ? <span className="relative z-10">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? (
              <IconFrame className="mr-2 h-6 w-6 rounded-md">
                <SunGlyph />
              </IconFrame>
            ) : (
              <IconFrame className="mr-2 h-6 w-6 rounded-md">
                <MoonGlyph />
              </IconFrame>
            )}
            {!collapsed ? "Theme" : null}
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onToggleCollapse}>
            {!collapsed ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>
    </aside>
  );
};
