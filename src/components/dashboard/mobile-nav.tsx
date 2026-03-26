"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_ITEMS } from "@/lib/dashboard-navigation";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {DASHBOARD_NAV_ITEMS.filter((item) => item.showInMobile).map(({ href, icon: Icon, mobileLabel }) => {
          const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {isActive ? (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                ) : null}
              </div>
              <span className="text-[10px] font-medium">{mobileLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
