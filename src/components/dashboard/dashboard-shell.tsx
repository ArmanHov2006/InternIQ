"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/dashboard/sidebar";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { ShortcutsHelp } from "@/components/dashboard/shortcuts-help";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Search } from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
  user: {
    email: string;
    fullName: string;
    avatarUrl: string;
  };
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  useKeyboardShortcuts();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("onboarding-complete")) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden">
        <div className="fixed inset-0 -z-10 bg-background">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        </div>
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/20 pb-20 md:pb-0">
          <div className="sticky top-0 z-20 flex h-14 items-center justify-end gap-2 border-b bg-background/75 px-4 backdrop-blur-xl md:h-16 md:px-6">
            <button
              type="button"
              onClick={() => document.dispatchEvent(new CustomEvent("open-command-palette"))}
              aria-label="Open command palette"
              className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent md:hidden"
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
            <ThemeToggle />
            <NotificationBell />
          </div>
          <div className="container mx-auto max-w-7xl p-4 sm:p-6">{children}</div>
        </main>
        <ShortcutsHelp />
        <MobileNav />
        {showOnboarding ? <OnboardingWizard onComplete={() => setShowOnboarding(false)} /> : null}
      </div>
    </TooltipProvider>
  );
}
