"use client";

import { create } from "zustand";
import type {
  DiscoveryPreferences,
  DiscoveryResumeContextOverrides,
  DiscoveryRunDiagnostics,
  DiscoverySourceAvailability,
  Opportunity,
} from "@/types/database";
import { getDiscoveryPrimaryScore } from "@/lib/services/discovery/ai-scorer";

export type DiscoverSort = "match" | "newest";
export type DiscoverFilter = "all" | "new" | "saved";

export type DiscoveryRunSummary = {
  runId: string;
  reviewedCount: number;
  activeCount: number;
  archivedCount: number;
  updatedCount: number;
  reactivatedCount: number;
  newOpportunitiesCount: number;
  sourceErrors?: Record<string, string>;
  diagnostics?: DiscoveryRunDiagnostics;
  sourceAvailability?: Record<string, DiscoverySourceAvailability>;
};

type DiscoveryRunResponse = Partial<DiscoveryRunSummary> & {
  error?: string;
  resultsCount?: number;
  sourceErrors?: Record<string, string>;
};

interface DiscoverState {
  preferences: DiscoveryPreferences | null;
  opportunities: Opportunity[];
  latestRunSummary: DiscoveryRunSummary | null;
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
  setLatestRunSummary: (summary: DiscoveryRunSummary | null) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  fetchPreferences: () => Promise<void>;
  fetchOpportunities: () => Promise<void>;
  runDiscovery: () => Promise<DiscoveryRunResponse>;
  scoreDiscoveryRun: (runId?: string, opportunityIds?: string[]) => Promise<{
    scored: number;
    candidates: number;
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
  latestRunSummary: null,
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
  setLatestRunSummary: (latestRunSummary) => set({ latestRunSummary }),

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
      const res = await fetch("/api/opportunities?discovery_scope=active_discovered", {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as Opportunity[];
      const discovered = Array.isArray(data)
        ? data.filter((opportunity) => isDiscovered(opportunity) && opportunity.status === "new")
        : [];
      set((state) => {
        const visibleIds = new Set(discovered.map((opportunity) => opportunity.id));
        return {
          opportunities: discovered,
          selectedIds: new Set(Array.from(state.selectedIds).filter((id) => visibleIds.has(id))),
        };
      });
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
        runId?: string;
        reviewedCount?: number;
        activeCount?: number;
        archivedCount?: number;
        updatedCount?: number;
        reactivatedCount?: number;
        resultsCount?: number;
        newOpportunitiesCount?: number;
        diagnostics?: DiscoveryRunDiagnostics;
        sourceAvailability?: Record<string, DiscoverySourceAvailability>;
      };
      if (!res.ok) {
        return { error: payload.error ?? "Discovery failed", sourceErrors: payload.sourceErrors };
      }
      await get().fetchOpportunities();
      await get().fetchPreferences();
      if (payload.runId) {
        set({
          latestRunSummary: {
            runId: payload.runId,
            reviewedCount: payload.reviewedCount ?? payload.resultsCount ?? 0,
            activeCount: payload.activeCount ?? payload.newOpportunitiesCount ?? 0,
            archivedCount: payload.archivedCount ?? 0,
            updatedCount: payload.updatedCount ?? 0,
            reactivatedCount: payload.reactivatedCount ?? 0,
            newOpportunitiesCount: payload.newOpportunitiesCount ?? 0,
            sourceErrors: payload.sourceErrors,
            diagnostics: payload.diagnostics,
            sourceAvailability: payload.sourceAvailability ?? payload.diagnostics?.sourceAvailability,
          },
        });
        void get().scoreDiscoveryRun(payload.runId);
      }
      return {
        runId: payload.runId,
        reviewedCount: payload.reviewedCount ?? payload.resultsCount,
        activeCount: payload.activeCount ?? payload.newOpportunitiesCount,
        archivedCount: payload.archivedCount,
        updatedCount: payload.updatedCount,
        reactivatedCount: payload.reactivatedCount,
        sourceErrors: payload.sourceErrors,
        diagnostics: payload.diagnostics,
        sourceAvailability: payload.sourceAvailability ?? payload.diagnostics?.sourceAvailability,
        resultsCount: payload.reviewedCount ?? payload.resultsCount,
        newOpportunitiesCount: payload.newOpportunitiesCount,
      };
    } catch {
      return { error: "Network error" };
    } finally {
      set({ running: false });
    }
  },

  scoreDiscoveryRun: async (runId, opportunityIds) => {
    const resolvedRunId = runId ?? get().latestRunSummary?.runId;
    if (!resolvedRunId) {
      return { scored: 0, candidates: 0 };
    }

    set({ scoring: true });
    let totalScored = 0;
    let candidates = 0;

    try {
      for (let batch = 0; batch < 10; batch += 1) {
        const res = await fetch("/api/discovery/score", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: resolvedRunId,
            opportunity_ids: opportunityIds,
            limit: 10,
          }),
        });
        const payload = (await res.json()) as {
          error?: string;
          scored?: number;
          candidates?: number;
          remaining?: number;
          done?: boolean;
        };
        if (!res.ok) {
          throw new Error(payload.error ?? "Scoring failed");
        }

        totalScored += payload.scored ?? 0;
        candidates = Math.max(candidates, payload.candidates ?? 0);

        if ((payload.scored ?? 0) > 0) {
          await get().fetchOpportunities();
        }

        if (payload.done || (payload.remaining ?? 0) <= 0 || (payload.candidates ?? 0) === 0) {
          break;
        }
      }

      return { scored: totalScored, candidates };
    } finally {
      set({ scoring: false });
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
    set((state) => {
      const opportunities = state.opportunities
        .map((opportunity) => (opportunity.id === row.id ? row : opportunity))
        .filter((opportunity) => opportunity.status === "new");
      const selectedIds = new Set(state.selectedIds);
      if (row.status !== "new") {
        selectedIds.delete(row.id);
      }
      return { opportunities, selectedIds };
    }),
}));

export const selectFilteredOpportunities = (
  opportunities: Opportunity[],
  filter: DiscoverFilter,
  sort: DiscoverSort
): Opportunity[] => {
  void filter;
  const rows = opportunities.filter((opportunity) => opportunity.status === "new");
  rows.sort((a, b) => {
    const staleDelta = Number(Boolean(a.discovery_is_stale)) - Number(Boolean(b.discovery_is_stale));
    if (staleDelta !== 0) return staleDelta;
    if (sort === "match") {
      return (getDiscoveryPrimaryScore(b) ?? 0) - (getDiscoveryPrimaryScore(a) ?? 0);
    }
    const ta = a.posted_at || a.created_at;
    const tb = b.posted_at || b.created_at;
    return new Date(tb).getTime() - new Date(ta).getTime();
  });
  return rows;
};
