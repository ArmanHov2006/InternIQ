"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface KanbanFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: string | null;
  onFilterChange: (value: string | null) => void;
}

const chips = ["frontend", "backend", "product", "design", "data"];

export const KanbanFilters = ({ search, onSearchChange, filter, onFilterChange }: KanbanFiltersProps) => {
  return (
    <div className="mb-4 rounded-xl border border-border bg-sidebar p-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company or role..."
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = filter === chip;
            return (
              <motion.button
                key={chip}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onFilterChange(active ? null : chip)}
                className={`rounded-full px-3 py-1 text-xs capitalize ${active ? "bg-primary/20 text-primary dark:bg-primary/30 dark:text-white" : "bg-muted text-muted-foreground"}`}
              >
                {chip}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
