"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  AnalyzerGlyph,
  BrandMarkIcon,
  MoonGlyph,
  OpportunitiesGlyph,
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
  { href: "/dashboard/opportunities", label: "Opportunities", icon: OpportunitiesGlyph },
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
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName =
    typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user?.email?.split("@")[0] ?? "Account";

  return (
    <aside
      className={cn(
        "fixed inset-y-4 left-4 z-40 hidden overflow-hidden rounded-2xl border border-border md:block",
        "bg-sidebar",
        collapsed ? "w-16 px-1.5 py-3" : "w-64 p-3"
      )}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <Link
          href="/dashboard"
          className={cn("mb-4 flex shrink-0 items-center", collapsed ? "justify-center" : "gap-3 px-2")}
          data-cursor="pointer"
        >
          <BrandMarkIcon className="h-8 w-8 shrink-0 text-primary" aria-hidden />
          {!collapsed && (
            <span className="truncate text-lg font-bold tracking-tight text-foreground">InternIQ</span>
          )}
        </Link>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {dashboardNavItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center rounded-xl text-sm transition-colors duration-100",
                  collapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-4 py-2.5",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn("relative z-10 h-5 w-5 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                />
                {!collapsed ? <span className="relative z-10 truncate font-medium">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        {user && !collapsed ? (
          <div className="mt-auto shrink-0 border-t border-border pt-3">
            <div className="flex items-center gap-3 px-2 py-1">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary-foreground"
                aria-hidden
              >
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{displayName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user.email ?? ""}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className={cn("shrink-0 space-y-0.5", user && !collapsed ? "pt-2" : "mt-auto pt-2")}>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className={cn(
              "flex w-full items-center rounded-xl text-sm text-muted-foreground transition-colors duration-100 hover:bg-muted/60 hover:text-foreground",
              collapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-4 py-2.5"
            )}
          >
            {mounted && theme === "dark" ? (
              <SunGlyph className="h-5 w-5 shrink-0" />
            ) : (
              <MoonGlyph className="h-5 w-5 shrink-0" />
            )}
            {!collapsed && <span className="font-medium">Theme</span>}
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center rounded-xl text-sm text-muted-foreground transition-colors duration-100 hover:bg-muted/60 hover:text-foreground",
              collapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-4 py-2.5"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5 shrink-0" />
                <span className="font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
