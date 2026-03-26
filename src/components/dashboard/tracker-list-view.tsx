"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "@/lib/constants";
import type { Application } from "@/types/database";
import { AddApplicationDialog } from "@/components/dashboard/add-application-dialog";
import { ApplicationDetailDialog } from "@/components/dashboard/application-detail-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseApiError } from "@/lib/utils";
import {
  friendlyTimeAgo,
  getSourceBadge,
  parseSuggestedStatusFromEvidence,
} from "@/lib/status-automation-ui";

type TrackerListViewProps = {
  openAddDialogToken: number;
};

export function TrackerListView({ openAddDialogToken }: TrackerListViewProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    setAddDialogOpen(true);
  }, [openAddDialogToken]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/applications", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const payload = (await res.json()) as Application[] | { error?: string };
        if (!res.ok) {
          throw new Error(parseApiError(payload, "Failed to load applications."));
        }
        setApplications(payload as Application[]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load applications.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = statusFilter === "all" || application.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        application.company.toLowerCase().includes(query) ||
        application.role.toLowerCase().includes(query) ||
        application.location.toLowerCase().includes(query)
      );
    });
  }, [applications, searchQuery, statusFilter]);
  const latestAutoUpdate = useMemo(
    () =>
      applications
        .filter((application) => application.status_source === "email_auto" && application.auto_updated_at)
        .sort(
          (a, b) =>
            new Date(b.auto_updated_at ?? 0).getTime() -
            new Date(a.auto_updated_at ?? 0).getTime()
        )[0] ?? null,
    [applications]
  );
  const suggestions = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.suggestion_pending || application.status_source === "email_suggested"
      ),
    [applications]
  );

  const upsertApplication = (next: Application) => {
    setApplications((prev) => {
      const idx = prev.findIndex((item) => item.id === next.id);
      if (idx === -1) return [next, ...prev];
      const clone = [...prev];
      clone[idx] = next;
      return clone;
    });
  };

  const handleStatusChange = async (application: Application, status: ApplicationStatus) => {
    if (application.status === status) return;
    setUpdatingId(application.id);
    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: application.id,
          status,
        }),
      });
      const payload = (await res.json()) as Application | { error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Could not move application."));
      }
      const updated = payload as Application;
      upsertApplication(updated);
      toast.success(`Moved to ${STATUS_LABELS[status]}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not move application.");
    } finally {
      setUpdatingId(null);
    }
  };

  const postActionRefresh = async () => {
    const res = await fetch("/api/applications", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const payload = (await res.json()) as Application[];
    setApplications(payload);
  };

  const undoAutoUpdate = async (applicationId: string) => {
    try {
      const res = await fetch("/api/applications/undo-status", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });
      const payload = (await res.json()) as Application | { error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Undo failed."));
      }
      upsertApplication(payload as Application);
      await postActionRefresh();
      toast.success("Update reverted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Undo failed.");
    }
  };

  const applySuggestion = async (applicationId: string) => {
    try {
      const res = await fetch("/api/applications/apply-suggestion", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });
      const payload = (await res.json()) as Application | { error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Could not apply suggestion."));
      }
      upsertApplication(payload as Application);
      await postActionRefresh();
      toast.success("Suggestion applied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply suggestion.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/55 p-3 backdrop-blur-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, role, or location"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {APPLICATION_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {latestAutoUpdate ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              Updated from email {friendlyTimeAgo(latestAutoUpdate.auto_updated_at)}:{" "}
              <strong>
                {latestAutoUpdate.company} - {STATUS_LABELS[latestAutoUpdate.status]}
              </strong>
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => void undoAutoUpdate(latestAutoUpdate.id)}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Undo
          </Button>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Review suggestions</p>
            <Badge variant="outline">{suggestions.length}</Badge>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((application) => {
              const suggested = parseSuggestedStatusFromEvidence(application.status_evidence);
              return (
                <div
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/20 bg-background/70 px-2 py-1.5 text-xs"
                >
                  <span className="text-muted-foreground">
                    {application.company} - {application.role}{" "}
                    {suggested ? `-> ${suggested.label}` : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => void applySuggestion(application.id)}
                    >
                      Apply
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => void undoAutoUpdate(application.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-border/60 bg-card/55 p-6 text-sm text-muted-foreground">
          Loading applications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/55 p-6 text-sm text-muted-foreground">
          No applications match this filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((application) => (
            <Card key={application.id} className="border-border/70 bg-card/65 transition-all hover:border-primary/25 hover:shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                {(() => {
                  const sourceBadge = getSourceBadge(application);
                  return (
                    <Badge
                      variant="outline"
                      className={`w-fit px-2 py-0.5 text-[10px] sm:hidden ${sourceBadge.className}`}
                    >
                      {sourceBadge.label}
                    </Badge>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => {
                    setSelected(application);
                    setDetailOpen(true);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-semibold">{application.company}</p>
                  <p className="truncate text-sm text-muted-foreground">{application.role}</p>
                  <p className="truncate text-xs text-muted-foreground/80">
                    {application.location || "Location not set"} •{" "}
                    {application.applied_date || "Date not set"}
                  </p>
                </button>

                {(() => {
                  const sourceBadge = getSourceBadge(application);
                  return (
                    <Badge
                      variant="outline"
                      className={`hidden w-fit px-2 py-0.5 text-[10px] sm:inline-flex ${sourceBadge.className}`}
                    >
                      {sourceBadge.label}
                    </Badge>
                  );
                })()}

                <div className="w-full sm:w-[220px]">
                  <Select
                    value={application.status}
                    onValueChange={(value) =>
                      void handleStatusChange(application, value as ApplicationStatus)
                    }
                    disabled={updatingId === application.id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {updatingId === application.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddApplicationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreated={(application) => {
          upsertApplication(application);
        }}
      />

      <ApplicationDetailDialog
        application={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={(application) => {
          upsertApplication(application);
          setSelected(application);
        }}
        onDeleted={(id) => {
          setApplications((prev) => prev.filter((item) => item.id !== id));
          if (selected?.id === id) {
            setSelected(null);
            setDetailOpen(false);
          }
        }}
      />
    </div>
  );
}
