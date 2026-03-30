"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { IconFrame, SearchGlyph } from "@/components/ui/icons/premium-icons";
import { dispatchOpenAddApplication } from "@/lib/events";
import { useChatStore } from "@/stores/chat-store";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pipeline", href: "/dashboard/pipeline" },
  { label: "Insights", href: "/dashboard/insights" },
  { label: "Settings", href: "/dashboard/settings" },
];

export const CommandPalette = () => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [sequence, setSequence] = useState("");

  const isTypingContext = () => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      active.isContentEditable ||
      active.getAttribute("role") === "textbox"
    );
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        useChatStore.getState().toggle();
        return;
      }
      if (event.key === "Escape") {
        setOpen(false);
        setSequence("");
        return;
      }
      if (!open && !isTypingContext() && event.key === "?") {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (!open && !isTypingContext() && event.key.toLowerCase() === "c") {
        event.preventDefault();
        dispatchOpenAddApplication();
        return;
      }
      if (!open && !isTypingContext() && event.key.toLowerCase() === "g") {
        setSequence("g");
        window.setTimeout(() => setSequence(""), 800);
        return;
      }
      if (sequence === "g" && !isTypingContext()) {
        const key = event.key.toLowerCase();
        if (key === "d") {
          router.push("/dashboard");
          setSequence("");
          return;
        }
        if (key === "t") {
          router.push("/dashboard/pipeline");
          setSequence("");
          return;
        }
        if (key === "i") {
          router.push("/dashboard/insights");
          setSequence("");
          return;
        }
        if (key === "s") {
          router.push("/dashboard/settings");
          setSequence("");
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, router, sequence]);

  const actions = [
    {
      label: "Quick Add Application",
      onSelect: () => {
        setOpen(false);
        dispatchOpenAddApplication();
      },
    },
    {
      label: "Chat with AI",
      onSelect: () => {
        setOpen(false);
        useChatStore.getState().open();
      },
    },
    {
      label: "Toggle Theme",
      onSelect: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        setOpen(false);
      },
    },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-md p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass-strong mx-auto mt-[12vh] max-w-xl rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="rounded-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-4">
                <IconFrame className="h-6 w-6 rounded-md border-white/10 bg-white/[0.03] text-muted-foreground shadow-none">
                  <SearchGlyph />
                </IconFrame>
                <Command.Input
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Search pages and actions..."
                />
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>
                <Command.Group heading="Actions" className="text-xs text-muted-foreground">
                  {actions.map((item) => (
                    <Command.Item
                      key={item.label}
                      onSelect={item.onSelect}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-white/10"
                    >
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Navigate" className="text-xs text-muted-foreground">
                  {navItems.map((item) => (
                    <Command.Item
                      key={item.href}
                      onSelect={() => {
                        router.push(item.href);
                        setOpen(false);
                      }}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-white/10"
                    >
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
              <div className="border-t border-white/10 px-3 py-2 text-xs text-muted-foreground">
                <span className="mr-3">Ctrl/Cmd+K open</span>
                <span className="mr-3">Ctrl/Cmd+J chat</span>
                <span className="mr-3">C quick add</span>
                <span className="mr-3">G then D/T/I/S jump</span>
                <span>? shortcuts</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
