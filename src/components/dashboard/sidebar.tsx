"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AnalyzerGlyph,
  BrandMarkIcon,
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
  { href: "/dashboard", label: "Dashboard", icon: OverviewGlyph },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: TrackerGlyph },
  { href: "/dashboard/insights", label: "Insights", icon: AnalyzerGlyph },
  { href: "/dashboard/settings", label: "Settings", icon: ProfileGlyph },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const Sidebar = ({ collapsed, onToggleCollapse }: SidebarProps) => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside
      className={cn(
        "fixed inset-y-4 left-4 z-40 hidden overflow-hidden rounded-2xl md:block",
        "glass-strong",
        collapsed ? "w-14 px-1.5 py-3" : "w-72 p-3"
      )}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <Link
          href="/dashboard"
          className={cn("mb-4 flex shrink-0 items-center", collapsed ? "justify-center" : "gap-2 px-2")}
          data-cursor="pointer"
        >
          <BrandMarkIcon className="h-5 w-5 shrink-0 text-primary" />
          {!collapsed && <span className="font-display text-xl">InternIQ</span>}
        </Link>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {dashboardNavItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center rounded-lg text-sm transition-colors",
                  collapsed ? "mx-auto h-9 w-9 justify-center" : "gap-3 px-3 py-2",
                  active ? "text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-lg bg-primary/20"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="relative z-10 h-4 w-4 shrink-0" />
                {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto shrink-0 space-y-0.5 pt-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className={cn(
              "flex w-full items-center rounded-lg text-sm text-muted-foreground transition-colors hover:text-white",
              collapsed ? "mx-auto h-9 w-9 justify-center" : "gap-2 px-3 py-2"
            )}
          >
            {mounted && theme === "dark" ? (
              <SunGlyph className="h-4 w-4 shrink-0" />
            ) : (
              <MoonGlyph className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && <span>Theme</span>}
          </button>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center rounded-lg text-sm text-muted-foreground transition-colors hover:text-white",
              collapsed ? "mx-auto h-9 w-9 justify-center" : "gap-2 px-3 py-2"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
