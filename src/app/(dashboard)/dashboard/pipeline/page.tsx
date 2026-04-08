"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Sparkles } from "lucide-react";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";
import { toast } from "sonner";
import type { Application } from "@/types/database";
import { AddApplicationDialog } from "@/components/dashboard/add-application-dialog";
import { KanbanSkeleton } from "@/components/dashboard/kanban-skeleton";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useKanbanStore } from "@/stores/kanban-store";

const STATUS_TEXT_COLORS: Record<string, string> = {
  saved: "text-orange-400",
  applied: "text-orange-300",
  interview: "text-amber-200",
  offer: "text-green-400",
  rejected: "text-red-400",
};

export default function PipelinePage() {
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { cards, columns, hydrateFromApplications, addOrUpdateFromApplication } = useKanbanStore();

  useEffect(() => {
    const syncApplications = async () => {
      try {
        const res = await fetch("/api/applications", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Could not load applications.");
        const applications = (await res.json()) as Application[];
        hydrateFromApplications(applications);
      } catch {
        const hasLocalCards = Object.keys(useKanbanStore.getState().cards).length > 0;
        if (hasLocalCards) {
          toast.info("Using demo data");
        } else {
          toast.error("Could not load applications.");
        }
      } finally {
        setLoading(false);
      }
    };
    void syncApplications();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncApplications();
      }
    }, 45_000);
    const onFocus = () => {
      void syncApplications();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [hydrateFromApplications]);

  const cardCount = Object.keys(cards).length;

  const statusCounts = useMemo(() => {
    return APPLICATION_STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: columns[status]?.cardIds.length ?? 0,
      textColor: STATUS_TEXT_COLORS[status] ?? "text-muted-foreground",
    }));
  }, [columns]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your application workspace — open a card for details and AI actions.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add application
        </Button>
      </div>

      {!loading && cardCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            <span className="font-mono text-foreground">{cardCount}</span> Total
          </span>
          {statusCounts.map(({ status, label, count, textColor }) => (
            <span key={status} className="flex items-center gap-0.5">
              <span className="text-muted-foreground/40">|</span>
              <span className={`ml-1 font-mono ${textColor}`}>{count}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      ) : null}

      {loading ? <KanbanSkeleton /> : null}
      {!loading && cardCount === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title="No applications yet"
          description="Your pipeline is empty — add an application manually or discover jobs with AI."
          action={
            <div className="flex items-center gap-3">
              <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add application
              </Button>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link href="/dashboard/discover">
                  <Sparkles className="h-4 w-4" />
                  Discover jobs
                </Link>
              </Button>
            </div>
          }
        />
      ) : null}
      {!loading && cardCount > 0 ? <KanbanBoard /> : null}

      <AddApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(application) => {
          addOrUpdateFromApplication(application);
        }}
      />
    </div>
  );
}
