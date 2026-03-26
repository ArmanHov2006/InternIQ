"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const shortcuts = [
  ["Cmd/Ctrl + K", "Command palette"],
  ["G D", "Go to Dashboard"],
  ["G T", "Go to Tracker"],
  ["G P", "Go to Profile"],
  ["G A", "Go to AI Analyze"],
  ["G E", "Go to Email Generator"],
  ["G I", "Go to Insights"],
  ["N", "New Application"],
  ["[", "Toggle sidebar"],
  ["?", "Show shortcuts"],
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onToggle = () => setOpen((prev) => !prev);
    document.addEventListener("toggle-shortcuts-help", onToggle);
    return () => document.removeEventListener("toggle-shortcuts-help", onToggle);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border depth-2 p-6"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
            <p className="mt-1 text-sm text-muted-foreground">Move faster with power-user controls.</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {shortcuts.map(([key, action]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>{action}</span>
                  <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
