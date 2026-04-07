"use client";

import { create } from "zustand";
import type { DiscoveryPreferences, DiscoveryResumeContextOverrides, Opportunity } from "@/types/database";

export type DiscoverSort = "match" | "newest";
export type DiscoverFilter = "all" | "new" | "saved";

interface DiscoverState {
  preferences: DiscoveryPreferences | null;
  opportunities: Opportunity[];
  loading: boolean;
  running: boolean;
  scoring: boolean;
  autoFilling: boolean;
  sort: DiscoverSort;
  filter: DiscoverFilter;
  selectedIds: Set<string>;
  setPreferences: (p: DiscoveryPreferences | null) => void;
  setOpportunities: (rows: Opportunity[]) => void;
  setLoading: (v: boolean) => void;
  setRunning: (v: boolean) => void;
  setScoring: (v: boolean) => void;
  setSort: (s: DiscoverSort) => void;
  setFilter: (f: DiscoverFilter) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  fetchPreferences: () => Promise<void>;
  fetchOpportunities: () => Promise<void>;
  runDiscovery: () => Promise<{
    error?: string;
    sourceErrors?: Record<string, string>;
    resultsCount?: number;
    newOpportunitiesCount?: number;
  }>;
  autoFillFromResume: () => Promise<{
    error?: string;
    overrides?: DiscoveryResumeContextOverrides;
    source?: string;
  }>;
  updateOpportunity: (row: Opportunity) => void;
}

const isDiscovered = (o: Opportunity) => Boolean(o.api_source && o.api_job_id);

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  preferences: null,
  opportunities: [],
  loading: true,
  running: false,
  scoring: false,
  autoFilling: false,
  sort: "match",
  filter: "all",
  selectedIds: new Set(),

  setPreferences: (preferences) => set({ preferences }),
  setOpportunities: (opportunities) => set({ opportunities }),
  setLoading: (loading) => set({ loading }),
  setRunning: (running) => set({ running }),
  setScoring: (scoring) => set({ scoring }),
  setSort: (sort) => set({ sort }),
  setFilter: (filter) => set({ filter }),

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  clearSelection: () => set({ selectedIds: new Set() }),

  fetchPreferences: async () => {
    const res = await fetch("/api/discovery/preferences", { credentials: "same-origin" });
    if (!res.ok) return;
    const data = (await res.json()) as DiscoveryPreferences;
    set({ preferences: data });
  },

  fetchOpportunities: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/opportunities", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as Opportunity[];
      const discovered = Array.isArray(data) ? data.filter(isDiscovered) : [];
      set({ opportunities: discovered });
    } finally {
      set({ loading: false });
    }
  },

  runDiscovery: async () => {
    set({ running: true });
    try {
      const res = await fetch("/api/discovery/run", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await res.json()) as {
        error?: string;
        sourceErrors?: Record<string, string>;
        resultsCount?: number;
        newOpportunitiesCount?: number;
      };
      if (!res.ok) {
        return { error: payload.error ?? "Discovery failed", sourceErrors: payload.sourceErrors };
      }
      await get().fetchOpportunities();
      await get().fetchPreferences();
      return {
        sourceErrors: payload.sourceErrors,
        resultsCount: payload.resultsCount,
        newOpportunitiesCount: payload.newOpportunitiesCount,
      };
    } catch {
      return { error: "Network error" };
    } finally {
      set({ running: false });
    }
  },

  autoFillFromResume: async () => {
    set({ autoFilling: true });
    try {
      const res = await fetch("/api/discovery/auto-fill", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await res.json()) as {
        error?: string;
        overrides?: DiscoveryResumeContextOverrides;
        source?: string;
      };
      if (!res.ok) {
        return { error: payload.error ?? "Auto-fill failed" };
      }
      if (payload.overrides) {
        // Save the overrides to preferences
        const saveRes = await fetch("/api/discovery/preferences", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_context_enabled: true,
            resume_context_customized: true,
            resume_context_overrides: payload.overrides,
          }),
        });
        if (saveRes.ok) {
          const updated = (await saveRes.json()) as DiscoveryPreferences;
          set({ preferences: updated });
        }
      }
      return { overrides: payload.overrides, source: payload.source };
    } catch {
      return { error: "Network error" };
    } finally {
      set({ autoFilling: false });
    }
  },

  updateOpportunity: (row) =>
    set((s) => ({
      opportunities: s.opportunities.map((o) => (o.id === row.id ? row : o)),
    })),
}));

export const selectFilteredOpportunities = (
  opportunities: Opportunity[],
  filter: DiscoverFilter,
  sort: DiscoverSort
): Opportunity[] => {
  let rows = [...opportunities];
  if (filter === "new") rows = rows.filter((o) => o.status === "new");
  if (filter === "saved") rows = rows.filter((o) => o.status === "saved");
  rows.sort((a, b) => {
    if (sort === "match") {
      return (b.match_score ?? 0) - (a.match_score ?? 0);
    }
    const ta = a.posted_at || a.created_at;
    const tb = b.posted_at || b.created_at;
    return new Date(tb).getTime() - new Date(ta).getTime();
  });
  return rows;
};
