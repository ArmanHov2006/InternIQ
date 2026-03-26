"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { dashboardNavItems } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import {
  BrandMarkIcon,
  IconFrame,
  MoonGlyph,
  SunGlyph,
} from "@/components/ui/icons/premium-icons";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const MobileTopBar = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="glass-strong fixed inset-x-3 top-3 z-50 flex h-14 items-center justify-between rounded-xl px-3 md:hidden">
      <Link href="/dashboard" className="inline-flex items-center gap-2">
        <IconFrame className="h-7 w-7 rounded-md">
          <BrandMarkIcon />
        </IconFrame>
        <span className="font-display text-lg">InternIQ</span>
      </Link>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted && theme === "dark" ? <SunGlyph /> : <MoonGlyph />}
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88%] max-w-sm border-white/10 bg-background/95 p-0">
            <div className="flex h-full flex-col p-4">
              <div className="mb-4 inline-flex items-center gap-2">
                <IconFrame className="h-7 w-7 rounded-md">
                  <BrandMarkIcon />
                </IconFrame>
                <span className="font-display text-xl">InternIQ</span>
              </div>
              <nav className="space-y-1">
                {dashboardNavItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2",
                        active
                          ? "bg-primary/20 text-foreground"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      <IconFrame className="h-6 w-6 rounded-md border-white/10 bg-white/[0.03]">
                        <item.icon />
                      </IconFrame>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
