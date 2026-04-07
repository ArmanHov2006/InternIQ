"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Application, Opportunity } from "@/types/database";
import { parseStoredAi } from "@/lib/services/discovery/ai-scorer";
import { cn } from "@/lib/utils";
import { useKanbanStore } from "@/stores/kanban-store";
import { useDiscoverStore } from "@/stores/discover-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const scoreClass = (score: number | null) => {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
};

const hasAiScore = (opportunity: Opportunity) => {
  const score = opportunity.ai_score;
  return score != null && typeof score === "object" && Object.keys(score as object).length > 0;
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

  return (
    <GlassCard className={cn("p-4", hasAiScore(opportunity) && "border-primary/20 shadow-glow-xs")}>
      <div className="flex gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          checked={selectedIds.has(opportunity.id)}
          onChange={() => toggleSelect(opportunity.id)}
          aria-label="Select for batch Smart Apply"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold leading-snug text-foreground">{opportunity.role}</p>
              <p className="text-sm text-muted-foreground">{opportunity.company}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {opportunity.api_source ? (
                <Badge variant="secondary" className="text-xs capitalize">
                  {opportunity.api_source}
                </Badge>
              ) : null}
              <span className={cn("font-mono text-sm font-medium tabular-nums", scoreClass(opportunity.match_score))}>
                {opportunity.match_score ?? "-"}%
              </span>
            </div>
          </div>

          <p className="line-clamp-2 text-xs text-muted-foreground">
            {[opportunity.location, opportunity.salary_range].filter(Boolean).join(" - ")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Fast match score based on your resume, profile, and saved skills.
            {ai ? " AI evaluation adds a second opinion below." : ""}
          </p>

          {ai ? (
            <details className="rounded-md border border-border bg-muted/30 p-2 text-xs">
              <summary className="cursor-pointer font-medium text-foreground">
                AI evaluation - <span className="font-mono tabular-nums">{ai.overall_score}%</span>
              </summary>
              <p className="mt-2 text-muted-foreground">{ai.reasoning}</p>
              <ul className="mt-2 space-y-0.5 font-mono text-[11px] text-muted-foreground">
                <li>Skills {ai.dimensions.skills}%</li>
                <li>Role fit {ai.dimensions.role_fit}%</li>
                <li>Growth {ai.dimensions.growth}%</li>
                <li>Practical {ai.dimensions.practical}%</li>
              </ul>
              {ai.key_strengths.length ? (
                <p className="mt-2 text-muted-foreground">
                  <span className="font-medium text-foreground">Strengths:</span>{" "}
                  {ai.key_strengths.join("; ")}
                </p>
              ) : null}
              {ai.key_gaps.length ? (
                <p className="mt-1 text-muted-foreground">
                  <span className="font-medium text-foreground">Gaps:</span> {ai.key_gaps.join("; ")}
                </p>
              ) : null}
            </details>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="default" disabled={saving} onClick={onSaveToPipeline}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Save to Pipeline
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={openJob}
              disabled={!opportunity.job_url || opportunity.job_url === "#"}
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" aria-hidden />
              Open Job
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={smartBusy} onClick={onSmartApply}>
              {smartBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden />
              )}
              Smart Apply
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
