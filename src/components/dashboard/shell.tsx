"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MobileTopBar } from "@/components/dashboard/mobile-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { CommandPalette } from "@/components/ui/command-palette";

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      <MobileTopBar />
      <CommandPalette />
      <main className={collapsed ? "p-6 pt-24 md:pl-24 md:pt-6" : "p-6 pt-24 md:pl-80 md:pt-6"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
