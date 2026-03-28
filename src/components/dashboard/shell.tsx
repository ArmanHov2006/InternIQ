"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AddApplicationDialog } from "@/components/dashboard/add-application-dialog";
import { ErrorBoundary } from "@/components/error-boundary";
import { MobileTopBar } from "@/components/dashboard/mobile-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { OPEN_ADD_APPLICATION_EVENT } from "@/lib/events";

const CommandPalette = dynamic(
  () => import("@/components/ui/command-palette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("interniq.sidebar.collapsed");
      if (raw === "1") setCollapsed(true);
    } catch {
      // Ignore storage availability issues.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("interniq.sidebar.collapsed", collapsed ? "1" : "0");
    } catch {
      // Ignore storage availability issues.
    }
  }, [collapsed]);

  useEffect(() => {
    const open = () => setAddDialogOpen(true);
    window.addEventListener(OPEN_ADD_APPLICATION_EVENT, open);
    return () => window.removeEventListener(OPEN_ADD_APPLICATION_EVENT, open);
  }, []);

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      <MobileTopBar />
      <CommandPalette />
      <main
        id="main-content"
        className={collapsed ? "p-6 pt-24 md:pl-24 md:pt-6" : "p-6 pt-24 md:pl-80 md:pt-6"}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <ErrorBoundary>{children}</ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
      <AddApplicationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreated={() => {
          // Individual pages refetch/hydrate data as needed.
        }}
      />
    </div>
  );
};
