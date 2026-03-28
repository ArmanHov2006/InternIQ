"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Application } from "@/types/database";
import { AddApplicationDialog } from "@/components/dashboard/add-application-dialog";
import { KanbanSkeleton } from "@/components/dashboard/kanban-skeleton";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useKanbanStore } from "@/stores/kanban-store";

export default function TrackerPage() {
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { cards, hydrateFromApplications, addOrUpdateFromApplication } = useKanbanStore();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl md:text-5xl">Tracker</h1>
        <MagneticButton className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Application
        </MagneticButton>
      </div>

      {loading ? <KanbanSkeleton /> : null}
      {!loading && cardCount === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title="No applications yet"
          description="Start tracking your application pipeline by adding your first application."
          action={
            <MagneticButton className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first application
            </MagneticButton>
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
