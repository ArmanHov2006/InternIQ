"use client";

import { useState } from "react";
import { ExternalLink, Loader2, MapPin, Sparkles, Clock, Building2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { Application, Opportunity } from "@/types/database";
import { SmartApplyReviewModal } from "./smart-apply-review-modal";
import {
  getDiscoveryPrimaryScore,
  getDiscoveryVerdictLabel,
  parseStoredAi,
} from "@/lib/services/discovery/ai-scorer";
import { cn } from "@/lib/utils";
import { useKanbanStore } from "@/stores/kanban-store";
import { useDiscoverStore } from "@/stores/discover-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const scoreColor = (score: number | null) => {
  if (score == null) return { text: "text-muted-foreground", bg: "bg-muted", bar: "bg-muted-foreground/30" };
  if (score >= 90) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500" };
  if (score >= 78) return { text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10", bar: "bg-teal-500" };
  if (score >= 64) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", bar: "bg-amber-500" };
  return { text: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", bar: "bg-red-500" };
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

const buildEvidencePreview = (opportunity: Opportunity) => {
  const ai = parseStoredAi(opportunity);
  if (ai?.evidence.length) return ai.evidence.slice(0, 2);

  const matched = opportunity.matched_keywords ?? [];
  const missing = opportunity.missing_keywords ?? [];
  const preview: string[] = [];
  if (matched.length > 0) {
    preview.push(`Overlap on ${matched.slice(0, 3).join(", ")}.`);
  }
  if (missing.length > 0) {
    preview.push(`Watch gaps in ${missing.slice(0, 2).join(", ")}.`);
  }
  if (preview.length === 0 && opportunity.match_summary) {
    preview.push(opportunity.match_summary);
  }
  return preview.slice(0, 2);
};

interface JobCardProps {
  opportunity: Opportunity;
}

export const JobCard = ({ opportunity }: JobCardProps) => {
  const [saving, setSaving] = useState(false);
  const [smartBusy, setSmartBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewApp, setReviewApp] = useState<Application | null>(null);
  const [reviewDraftAnswers, setReviewDraftAnswers] = useState<string | null>(null);
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

      // Fetch draft answers for the review modal
      let draftContent: string | null = null;
      if (payload.application?.id) {
        try {
          const draftRes = await fetch(
            `/api/applications/draft-answers?application_id=${payload.application.id}`,
            { credentials: "same-origin" }
          );
          if (draftRes.ok) {
            const draftData = (await draftRes.json()) as { content?: string } | null;
            draftContent = draftData?.content ?? null;
          }
        } catch {
          // Draft answers fetch is non-critical
        }
      }

      // Open review modal instead of toast + window.open
      setReviewApp(payload.application ?? null);
      setReviewDraftAnswers(draftContent);
      setReviewOpen(true);
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
  const primaryScore = getDiscoveryPrimaryScore(opportunity);
  const colors = scoreColor(primaryScore);
  const matchedKw = opportunity.matched_keywords ?? [];
  const missingKw = opportunity.missing_keywords ?? [];
  const evidence = buildEvidencePreview(opportunity);
  const posted = relativeTime(opportunity.posted_at ?? null);
  const verdictLabel = ai ? getDiscoveryVerdictLabel(ai.verdict) : "Heuristic";
  const heuristicScore = typeof opportunity.match_score === "number" ? opportunity.match_score : null;

  return (
    <GlassCard
      className={cn(
        "group relative p-4 transition-shadow duration-150 hover:shadow-md",
        ai && "border-primary/20 shadow-glow-xs"
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

            <div className="flex shrink-0 items-center gap-2 self-start">
              {opportunity.api_source ? (
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {opportunity.api_source}
                </Badge>
              ) : null}
              {opportunity.discovery_is_stale ? (
                <Badge variant="outline" className="text-[10px]">
                  Stale
                </Badge>
              ) : null}
              <div className={cn("min-w-[68px] rounded-xl px-2.5 py-2 text-center", colors.bg)}>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Fit
                </p>
                <span className={cn("font-mono text-base font-semibold tabular-nums", colors.text)}>
                  {primaryScore ?? "--"}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  ai
                    ? "border-border/80 bg-background/60 text-foreground"
                    : "border-border/60 bg-muted/40 text-muted-foreground"
                )}
              >
                {verdictLabel}
              </Badge>
              {ai ? (
                <span className="text-[11px] text-muted-foreground">
                  Conservative AI rerank
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  Retrieval score while AI rerank is unavailable
                </span>
              )}
              {opportunity.discovery_is_stale ? (
                <span className="text-[11px] text-amber-500">
                  Not seen in the latest run yet
                </span>
              ) : null}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-300", colors.bar)}
                style={{ width: `${Math.min(primaryScore ?? 0, 100)}%` }}
              />
            </div>
          </div>

          {opportunity.salary_range ? (
            <p className="font-mono text-xs text-muted-foreground">{opportunity.salary_range}</p>
          ) : null}

          {evidence.length > 0 ? (
            <div className="space-y-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
              {evidence.map((item) => (
                <p key={item} className="text-xs leading-relaxed text-muted-foreground">
                  {item}
                </p>
              ))}
            </div>
          ) : null}

          <details className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-xs">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium text-foreground">
              <span>Why this surfaced</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            </summary>
            <div className="mt-3 space-y-3 text-muted-foreground">
              {ai?.reasoning ? (
                <p className="leading-relaxed">{ai.reasoning}</p>
              ) : (
                <p className="leading-relaxed">{opportunity.match_summary}</p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border/50 bg-background/70 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Primary score
                  </p>
                  <p className="mt-1 font-mono text-sm text-foreground">
                    {primaryScore ?? "--"} / 100
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/70 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Heuristic score
                  </p>
                  <p className="mt-1 font-mono text-sm text-foreground">
                    {heuristicScore ?? "--"} / 100
                  </p>
                </div>
              </div>

              {ai ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/50 bg-background/70 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Subscores
                    </p>
                    <div className="mt-1 space-y-1 font-mono text-[11px]">
                      <p>Must-have {ai.subscores.must_have}%</p>
                      <p>Seniority {ai.subscores.seniority}%</p>
                      <p>Skills {ai.subscores.skills}%</p>
                      <p>Logistics {ai.subscores.logistics}%</p>
                      <p>Upside {ai.subscores.upside}%</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/70 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Risk flags
                    </p>
                    {ai.gating_flags.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ai.gating_flags.map((flag) => (
                          <span
                            key={flag}
                            className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500"
                          >
                            {flag.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-muted-foreground">No major gating flags.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {matchedKw.length > 0 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Matched
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {matchedKw.slice(0, 6).map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {missingKw.length > 0 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Gaps
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {missingKw.slice(0, 5).map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {ai?.gaps.length ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    AI-noted gaps
                  </p>
                  <div className="mt-1 space-y-1">
                    {ai.gaps.map((gap) => (
                      <p key={gap}>{gap}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </details>

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
              className={cn(
                "h-7 px-2.5 text-xs",
                smartBusy && "animate-glow-pulse shadow-glow-xs"
              )}
              disabled={smartBusy}
              onClick={onSmartApply}
            >
              {smartBusy ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="mr-1 h-3 w-3" aria-hidden />
              )}
              {smartBusy ? "Generating..." : "Smart Apply"}
            </Button>
          </div>
        </div>
      </div>

      <SmartApplyReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        application={reviewApp}
        opportunity={opportunity}
        draftAnswers={reviewDraftAnswers}
      />
    </GlassCard>
  );
};
