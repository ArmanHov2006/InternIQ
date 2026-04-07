"use client";

import { useState } from "react";
import { ExternalLink, Loader2, MapPin, Sparkles, Clock, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { Application, Opportunity } from "@/types/database";
import { parseStoredAi } from "@/lib/services/discovery/ai-scorer";
import { cn } from "@/lib/utils";
import { useKanbanStore } from "@/stores/kanban-store";
import { useDiscoverStore } from "@/stores/discover-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const scoreColor = (score: number | null) => {
  if (score == null) return { text: "text-muted-foreground", bg: "bg-muted", bar: "bg-muted-foreground/30" };
  if (score >= 80) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500" };
  if (score >= 60) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", bar: "bg-amber-500" };
  return { text: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", bar: "bg-red-500" };
};

const hasAiScore = (opportunity: Opportunity) => {
  const score = opportunity.ai_score;
  return score != null && typeof score === "object" && Object.keys(score as object).length > 0;
};

const relativeTime = (date: string | null): string => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

interface JobCardProps {
  opportunity: Opportunity;
}

export const JobCard = ({ opportunity }: JobCardProps) => {
  const [saving, setSaving] = useState(false);
  const [smartBusy, setSmartBusy] = useState(false);
  const addOrUpdateFromApplication = useKanbanStore((state) => state.addOrUpdateFromApplication);
  const updateOpportunity = useDiscoverStore((state) => state.updateOpportunity);
  const toggleSelect = useDiscoverStore((state) => state.toggleSelect);
  const selectedIds = useDiscoverStore((state) => state.selectedIds);

  const onSaveToPipeline = async () => {
    if (opportunity.application_id) {
      toast.message("Already linked to pipeline.");
      return;
    }

    setSaving(true);
    try {
      const createResponse = await fetch("/api/applications", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          company: opportunity.company,
          role: opportunity.role,
          status: "saved",
          location: opportunity.location,
          job_url: opportunity.job_url,
          job_description: opportunity.job_description,
          source: "automation",
          board: opportunity.board,
          external_job_id: opportunity.external_job_id ?? opportunity.api_job_id,
          match_score: opportunity.match_score,
          notes: opportunity.match_summary,
        }),
      });
      const createdApplication = (await createResponse.json()) as Application | { error?: string };
      if (!createResponse.ok || !("id" in createdApplication)) {
        throw new Error(
          ("error" in createdApplication && createdApplication.error) || "Could not create application."
        );
      }

      addOrUpdateFromApplication(createdApplication as Application);

      const updateResponse = await fetch("/api/opportunities", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          id: opportunity.id,
          status: "saved",
          application_id: (createdApplication as Application).id,
        }),
      });
      const updatedOpportunity = (await updateResponse.json()) as Opportunity | { error?: string };
      if (!updateResponse.ok || !("id" in updatedOpportunity)) {
        throw new Error(
          ("error" in updatedOpportunity && updatedOpportunity.error) || "Could not link opportunity."
        );
      }

      updateOpportunity(updatedOpportunity as Opportunity);
      toast.success("Saved to pipeline.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const onSmartApply = async () => {
    setSmartBusy(true);
    try {
      const response = await fetch("/api/discovery/smart-apply", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      });
      const payload = (await response.json()) as {
        error?: string;
        application?: Application;
        opportunity?: Opportunity;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Smart Apply failed");
      }
      if (payload.application) addOrUpdateFromApplication(payload.application);
      if (payload.opportunity) updateOpportunity(payload.opportunity);
      toast.success("Saved. Materials generated. Opening job page...");
      if (opportunity.job_url && opportunity.job_url !== "#") {
        window.open(opportunity.job_url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Smart Apply failed.");
    } finally {
      setSmartBusy(false);
    }
  };

  const openJob = () => {
    if (opportunity.job_url && opportunity.job_url !== "#") {
      window.open(opportunity.job_url, "_blank", "noopener,noreferrer");
    }
  };

  const ai = parseStoredAi(opportunity);
  const score = opportunity.match_score;
  const colors = scoreColor(score);
  const matchedKw = opportunity.matched_keywords ?? [];
  const missingKw = opportunity.missing_keywords ?? [];
  const posted = relativeTime(opportunity.posted_at ?? null);

  return (
    <GlassCard
      className={cn(
        "group relative p-4 transition-shadow duration-150 hover:shadow-md",
        hasAiScore(opportunity) && "border-primary/20 shadow-glow-xs"
      )}
    >
      <div className="flex gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border border-border bg-background text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          checked={selectedIds.has(opportunity.id)}
          onChange={() => toggleSelect(opportunity.id)}
          aria-label={`Select ${opportunity.role} at ${opportunity.company}`}
        />

        <div className="min-w-0 flex-1 space-y-3">
          {/* Header: Title + Score */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-semibold leading-snug text-foreground">
                {opportunity.role}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" aria-hidden />
                  {opportunity.company}
                </span>
                {opportunity.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {opportunity.location}
                  </span>
                ) : null}
                {posted ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden />
                    {posted}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {opportunity.api_source ? (
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {opportunity.api_source}
                </Badge>
              ) : null}
              <div className={cn("rounded-md px-2 py-1 text-center", colors.bg)}>
                <span className={cn("font-mono text-sm font-semibold tabular-nums", colors.text)}>
                  {score ?? "--"}%
                </span>
              </div>
            </div>
          </div>

          {/* Score Bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-300", colors.bar)}
                style={{ width: `${Math.min(score ?? 0, 100)}%` }}
              />
            </div>
            {opportunity.salary_range ? (
              <p className="font-mono text-xs text-muted-foreground">{opportunity.salary_range}</p>
            ) : null}
          </div>

          {/* Keyword chips */}
          {matchedKw.length > 0 || missingKw.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {matchedKw.slice(0, 4).map((kw) => (
                <span
                  key={kw}
                  className="inline-block rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                >
                  {kw}
                </span>
              ))}
              {missingKw.slice(0, 3).map((kw) => (
                <span
                  key={kw}
                  className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {kw}
                </span>
              ))}
            </div>
          ) : null}

          {/* AI Evaluation */}
          {ai ? (
            <details className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
              <summary className="cursor-pointer font-medium text-foreground">
                AI evaluation -{" "}
                <span className={cn("font-mono tabular-nums", scoreColor(ai.overall_score).text)}>
                  {ai.overall_score}%
                </span>
              </summary>
              <div className="mt-2 space-y-2">
                <p className="leading-relaxed text-muted-foreground">{ai.reasoning}</p>
                <div className="grid grid-cols-2 gap-1 font-mono text-[11px] text-muted-foreground">
                  <span>Skills {ai.dimensions.skills}%</span>
                  <span>Role fit {ai.dimensions.role_fit}%</span>
                  <span>Growth {ai.dimensions.growth}%</span>
                  <span>Practical {ai.dimensions.practical}%</span>
                </div>
                {ai.key_strengths.length ? (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-emerald-500">Strengths:</span>{" "}
                    {ai.key_strengths.join("; ")}
                  </p>
                ) : null}
                {ai.key_gaps.length ? (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-amber-500">Gaps:</span>{" "}
                    {ai.key_gaps.join("; ")}
                  </p>
                ) : null}
              </div>
            </details>
          ) : null}

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={opportunity.application_id ? "secondary" : "default"}
              className="h-7 px-2.5 text-xs"
              disabled={saving || Boolean(opportunity.application_id)}
              onClick={onSaveToPipeline}
            >
              {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden /> : null}
              {opportunity.application_id ? "In Pipeline" : "Save"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={openJob}
              disabled={!opportunity.job_url || opportunity.job_url === "#"}
            >
              <ExternalLink className="mr-1 h-3 w-3" aria-hidden />
              Open
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 px-2.5 text-xs"
              disabled={smartBusy}
              onClick={onSmartApply}
            >
              {smartBusy ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="mr-1 h-3 w-3" aria-hidden />
              )}
              Smart Apply
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
