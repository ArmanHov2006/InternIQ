"use client";

import { useEffect, useMemo, useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  List,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { DASHBOARD_PALETTE_NAV } from "@/lib/dashboard-navigation";
import { useAuth } from "@/hooks/use-auth";

type Item = {
  id: string;
  label: string;
  icon: React.ReactNode;
  group: "Navigation" | "Actions" | "Account";
  action: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
      if (key === "escape") {
        setOpen(false);
        return;
      }
      if (key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const openEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("open-command-palette", openEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("open-command-palette", openEvent);
    };
  }, []);

  const items = useMemo<Item[]>(
    () => [
      ...DASHBOARD_PALETTE_NAV.map((navItem) => ({
        id: `nav-${navItem.href}`,
        label: navItem.label,
        icon: <navItem.icon className="h-4 w-4" />,
        group: "Navigation" as const,
        action: () => router.push(navItem.href),
      })),
      {
        id: "nav-tracker-kanban",
        label: "Tracker (Kanban View)",
        icon: <LayoutGrid className="h-4 w-4" />,
        group: "Navigation",
        action: () => router.push("/dashboard/tracker?view=kanban"),
      },
      {
        id: "nav-tracker-list",
        label: "Tracker (List View)",
        icon: <List className="h-4 w-4" />,
        group: "Navigation",
        action: () => router.push("/dashboard/tracker?view=list"),
      },
      {
        id: "action-add",
        label: "Add Application",
        icon: <Plus className="h-4 w-4" />,
        group: "Actions",
        action: () => document.dispatchEvent(new CustomEvent("open-add-application")),
      },
      {
        id: "action-theme",
        label: `Toggle Theme (${theme === "dark" ? "Light" : "Dark"})`,
        icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        group: "Actions",
        action: () => setTheme(theme === "dark" ? "light" : "dark"),
      },
      {
        id: "account-signout",
        label: "Sign Out",
        icon: <LogOut className="h-4 w-4" />,
        group: "Account",
        action: () => {
          void signOut();
        },
      },
    ],
    [router, setTheme, signOut, theme]
  );

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative mx-auto mt-24 w-[92vw] max-w-xl">
        <CommandPrimitive className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <CommandPrimitive.Input
              autoFocus
              placeholder="Search commands..."
              className="h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandPrimitive.List className="max-h-[340px] overflow-y-auto p-2">
            <CommandPrimitive.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </CommandPrimitive.Empty>
            {(["Navigation", "Actions", "Account"] as const).map((group) => {
              const entries = items.filter((item) => item.group === group);
              if (entries.length === 0) return null;
              return (
                <CommandPrimitive.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {entries.map((item) => (
                    <CommandPrimitive.Item
                      key={item.id}
                      value={item.label}
                      onSelect={() => run(item.action)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      {item.label}
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              );
            })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </div>
    </div>
  );
}
