"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_ITEMS } from "@/lib/dashboard-navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, LogOut, Search } from "lucide-react";

interface SidebarProps {
  user: {
    email: string;
    fullName: string;
    avatarUrl: string;
  };
}

const SidebarContent = ({
  user,
  pathname,
  onSignOut,
  collapsed,
  onToggleCollapsed,
}: {
  user: SidebarProps["user"];
  pathname: string;
  onSignOut: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) => {
  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("p-6", collapsed && "px-4")}>
        <button
          onClick={onToggleCollapsed}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-accent"
          aria-label="Toggle sidebar"
          type="button"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </motion.div>
        </button>
        <Link href="/dashboard" className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">IQ</span>
          </div>
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap text-xl font-bold transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            InternIQ
          </span>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("open-command-palette"))}
          type="button"
          aria-label="Open command palette"
          className={cn(
            "mx-1 mb-2 flex items-center gap-2 rounded-lg border border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-accent/50",
            collapsed && "justify-center px-2"
          )}
        >
          <Search className="h-3.5 w-3.5" />
          {!collapsed ? (
            <>
              <span>Search</span>
              <div className="ml-auto flex items-center gap-0.5">
                <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">⌘</kbd>
                <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">K</kbd>
              </div>
            </>
          ) : null}
        </button>
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <div key={item.href}>
              {item.section === "ai" && item.href === "/dashboard/analyze" && !collapsed ? (
                <p className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  AI Tools
                </p>
              ) : null}
              <div className="relative">
                {isActive ? (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                ) : null}
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:translate-x-0.5 hover:bg-accent/50 hover:text-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap transition-all duration-300",
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                  {!collapsed ? (
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/50">
                      G {item.shortcut}
                    </span>
                  ) : null}
                </Link>
              </div>
            </div>
          );
        })}
      </nav>

      <Separator />

      {/* User info */}
      <div className="p-4">
        <div className={cn("mb-3 flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "min-w-0 flex-1 overflow-hidden transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            <p className="text-sm font-medium truncate">
              {user.fullName || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full text-muted-foreground", collapsed ? "justify-center px-2" : "justify-start")}
          onClick={onSignOut}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed ? "Sign out" : null}
        </Button>
      </div>
    </div>
  );
};

export const Sidebar = ({ user }: SidebarProps) => {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    setCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName && ["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) return;
      if (event.key === "[") {
        event.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <aside
      className={cn(
        "relative hidden border-r depth-1 transition-all duration-300 ease-in-out md:flex md:flex-col",
        collapsed ? "md:w-[68px]" : "md:w-64"
      )}
    >
        <SidebarContent
          user={user}
          pathname={pathname}
          onSignOut={signOut}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((prev) => !prev)}
        />
    </aside>
  );
};
