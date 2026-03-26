"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { TrackerListView } from "@/components/dashboard/tracker-list-view";
import { PageTransition } from "@/components/ui/page-transition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TrackerView = "kanban" | "list";

export default function TrackerPage() {
  const [openAddDialogToken, setOpenAddDialogToken] = useState(0);
  const [view, setView] = useState<TrackerView>("kanban");
  const [stageJump, setStageJump] = useState<string>("none");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const openFromCommand = () => setOpenAddDialogToken((prev) => prev + 1);
    document.addEventListener("open-add-application", openFromCommand);
    return () => document.removeEventListener("open-add-application", openFromCommand);
  }, []);

  useEffect(() => {
    const queryView = searchParams.get("view");
    if (queryView === "kanban" || queryView === "list") {
      setView(queryView);
      localStorage.setItem("tracker-view", queryView);
      return;
    }
    const stored = localStorage.getItem("tracker-view");
    if (stored === "kanban" || stored === "list") {
      setView(stored);
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem("tracker-view", view);
    router.replace(`${pathname}?view=${view}`, { scroll: false });
  }, [pathname, router, view]);

  useEffect(() => {
    if (sessionStorage.getItem("open-add-application-once") === "true") {
      sessionStorage.removeItem("open-add-application-once");
      setOpenAddDialogToken((prev) => prev + 1);
    }
  }, []);

  return (
    <PageTransition>
      <div className="space-y-5 pb-10">
        <div className="sticky top-16 z-20 rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Application Tracker</h1>
              <p className="text-sm text-muted-foreground">
                Drag applications across stages and keep your momentum visible every week.
              </p>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex w-fit rounded-lg border border-border/80 bg-background/75 p-1">
                <button
                  type="button"
                  onClick={() => setView("kanban")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    view === "kanban"
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    view === "list"
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  className="sm:min-w-[170px]"
                  onClick={() => setOpenAddDialogToken((prev) => prev + 1)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Application
                </Button>
                {view === "kanban" ? (
                  <Select
                    value={stageJump}
                    onValueChange={(value) => {
                      setStageJump(value);
                      if (value === "none") return;
                      const node = document.getElementById(`tracker-stage-${value}`);
                      node?.scrollIntoView({
                        behavior: "smooth",
                        inline: "start",
                        block: "nearest",
                      });
                    }}
                  >
                    <SelectTrigger className="w-[200px] bg-background/70">
                      <SelectValue placeholder="Jump to stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Jump to stage</SelectItem>
                      {APPLICATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div>
          {view === "kanban" ? (
            <KanbanBoard openAddDialogToken={openAddDialogToken} />
          ) : (
            <TrackerListView openAddDialogToken={openAddDialogToken} />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
