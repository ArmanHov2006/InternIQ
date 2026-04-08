"use client";

import { useState } from "react";
import { ArrowDownWideNarrow, Clock, Compass, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useDiscoverStore, selectFilteredOpportunities } from "@/stores/discover-store";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { Button } from "@/components/ui/button";
import { JobCard } from "./job-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKanbanStore } from "@/stores/kanban-store";
import type { Application, Opportunity } from "@/types/database";
import { getDiscoverEmptyState } from "@/lib/services/discovery/run-feedback";

export const JobFeed = () => {
  const opportunities = useDiscoverStore((s) => s.opportunities);
  const loading = useDiscoverStore((s) => s.loading);
  const preferences = useDiscoverStore((s) => s.preferences);
  const sort = useDiscoverStore((s) => s.sort);
  const setSort = useDiscoverStore((s) => s.setSort);
  const scoring = useDiscoverStore((s) => s.scoring);
  const setScoring = useDiscoverStore((s) => s.setScoring);
  const fetchOpportunities = useDiscoverStore((s) => s.fetchOpportunities);
  const latestRunSummary = useDiscoverStore((s) => s.latestRunSummary);
  const selectedIds = useDiscoverStore((s) => s.selectedIds);
  const clearSelection = useDiscoverStore((s) => s.clearSelection);
  const updateOpportunity = useDiscoverStore((s) => s.updateOpportunity);
  const addOrUpdateFromApplication = useKanbanStore((s) => s.addOrUpdateFromApplication);

  const [batchOpen, setBatchOpen] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);

  const rows = selectFilteredOpportunities(opportunities, "new", sort);
  const emptyState = getDiscoverEmptyState({
    latestRunSummary,
    minMatchScore: preferences?.min_match_score ?? 55,
  });

  const onAiScore = async () => {
    setScoring(true);
    try {
      const res = await fetch("/api/discovery/score", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: latestRunSummary?.runId }),
      });
      const payload = (await res.json()) as {
        error?: string;
        scored?: number;
        candidates?: number;
      };
      if (!res.ok) throw new Error(payload.error ?? "Scoring failed");
      toast.success(
        `Re-scored ${payload.scored ?? 0} of ${payload.candidates ?? payload.scored ?? 0} shortlist job(s).`
      );
      await fetchOpportunities();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scoring failed.");
    } finally {
      setScoring(false);
    }
  };

  const runBatchSmartApply = async () => {
    setBatchRunning(true);
    try {
      const res = await fetch("/api/discovery/smart-apply", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityIds: Array.from(selectedIds) }),
      });
      const payload = (await res.json()) as {
        error?: string;
        results?: Array<{ opportunity?: Opportunity; application?: Application }>;
      };
      if (!res.ok) throw new Error(payload.error ?? "Batch failed");
      for (const r of payload.results ?? []) {
        if (r.application) addOrUpdateFromApplication(r.application);
        if (r.opportunity) updateOpportunity(r.opportunity);
      }
      toast.success(`Processed ${selectedIds.size} job(s).`);
      clearSelection();
      setBatchOpen(false);
      await fetchOpportunities();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Batch failed.");
    } finally {
      setBatchRunning(false);
    }
  };

  const onBatchClick = () => {
    if (selectedIds.size === 0) {
      toast.message("Select jobs using the checkboxes.");
      return;
    }
    if (selectedIds.size > 3) {
      setBatchOpen(true);
      return;
    }
    void runBatchSmartApply();
  };

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          Current shortlist{" "}
          <span className="ml-1 font-mono text-[11px] text-foreground">{rows.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant={sort === "match" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => setSort("match")}
          >
            <ArrowDownWideNarrow className="mr-1 h-3 w-3" aria-hidden />
            Best match
          </Button>
          <Button
            type="button"
            variant={sort === "newest" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => setSort("newest")}
          >
            <Clock className="mr-1 h-3 w-3" aria-hidden />
            Newest
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            disabled={scoring || rows.length === 0}
            onClick={onAiScore}
          >
            <Sparkles className="mr-1 h-3 w-3" aria-hidden />
            Re-score shortlist
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            onClick={onBatchClick}
          >
            Batch Apply{" "}
            {selectedIds.size > 0 ? (
              <span className="ml-1 font-mono">({selectedIds.size})</span>
            ) : null}
          </Button>
        </div>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonShimmer key={i} className="h-44 rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-6 w-6" aria-hidden />}
          title={emptyState.title}
          description={emptyState.description}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((o) => (
            <JobCard key={o.id} opportunity={o} />
          ))}
        </div>
      )}

      {/* Batch confirmation dialog */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Smart Apply on {selectedIds.size} jobs?</DialogTitle>
            <DialogDescription>
              This creates applications, generates draft materials, and opens each job URL. You stay
              in control of submitting on the employer site. Rate limited to 10 batch actions per
              hour.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setBatchOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={batchRunning} onClick={() => void runBatchSmartApply()}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
