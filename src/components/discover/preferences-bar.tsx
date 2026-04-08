"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { useDiscoverStore } from "@/stores/discover-store";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ContextChipList } from "./context-chip-editor";
import {
  formatRunFeedback,
  type RunFeedback,
} from "@/lib/services/discovery/run-feedback";

interface PreferencesBarProps {
  onOpenPrefs: () => void;
  onOpenAdvanced: () => void;
}

const getResumeStatus = (hasResume: boolean, enabled: boolean): { label: string; tone: string } => {
  if (!hasResume) return { label: "No resume detected", tone: "warning" };
  if (!enabled) return { label: "Resume context off", tone: "muted" };
  return { label: "Using your latest resume", tone: "success" };
};

export const PreferencesBar = ({ onOpenPrefs, onOpenAdvanced }: PreferencesBarProps) => {
  const preferences = useDiscoverStore((s) => s.preferences);
  const running = useDiscoverStore((s) => s.running);
  const autoFilling = useDiscoverStore((s) => s.autoFilling);
  const runDiscovery = useDiscoverStore((s) => s.runDiscovery);
  const autoFillFromResume = useDiscoverStore((s) => s.autoFillFromResume);
  const [runFeedback, setRunFeedback] = useState<RunFeedback | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [contextOpen, setContextOpen] = useState(true);

  const preview = preferences?.resume_context_preview;
  const overrides = preferences?.resume_context_overrides;
  const status = getResumeStatus(Boolean(preview?.has_resume), Boolean(preferences?.resume_context_enabled));

  const onRun = async () => {
    setRunFeedback(null);
    const {
      error,
      sourceErrors,
      reviewedCount,
      activeCount,
      archivedCount,
      updatedCount,
      reactivatedCount,
      newOpportunitiesCount,
      diagnostics,
      sourceAvailability,
    } = await runDiscovery();
    if (error) {
      setRunFeedback({ tone: "error", message: error, details: [], sourceErrors });
      setLiveMessage(error);
      toast.error(error);
      return;
    }

    const reviewed = reviewedCount ?? 0;
    const visible = activeCount ?? 0;
    const hidden = archivedCount ?? 0;
    const inserted = newOpportunitiesCount ?? 0;
    const updated = updatedCount ?? 0;
    const reactivated = reactivatedCount ?? 0;
    const feedback = formatRunFeedback({
      diagnostics,
      minMatchScore: preferences?.min_match_score ?? 55,
      reviewed,
      visible,
      hidden,
      inserted,
      updated,
      reactivated,
      sourceErrors,
      sourceAvailability,
    });
    setRunFeedback(feedback);
    setLiveMessage(feedback.message);
    if (feedback.tone === "success" && reviewed > 0) {
      toast.success(feedback.message);
    }
  };

  const onAutoFill = async () => {
    const { error, source } = await autoFillFromResume();
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(
      source === "ai"
        ? "Search context updated from your resume using AI."
        : "Search context updated from your resume."
    );
  };

  const lastRun = preferences?.last_discovery_at
    ? new Date(preferences.last_discovery_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const notePreview = useMemo(() => overrides?.note?.trim() ?? "", [overrides?.note]);

  return (
    <div className="space-y-2">
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>

      <GlassCard className="p-5 sm:p-6">
        {/* Top bar: Status + Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px]",
                status.tone === "success" && "bg-emerald-500/10 text-emerald-400",
                status.tone === "warning" && "bg-amber-500/10 text-amber-300"
              )}
            >
              <FileText className="mr-1 h-3 w-3" aria-hidden />
              {status.label}
            </Badge>
            {lastRun ? (
              <span className="text-[11px] text-muted-foreground">Last run: {lastRun}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={autoFilling || !preview?.has_resume}
              onClick={onAutoFill}
            >
              {autoFilling ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              )}
              Auto-fill from resume
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={onOpenPrefs}
            >
              <Settings2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Edit context
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={onOpenAdvanced}
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Filters
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              disabled={running}
              onClick={onRun}
            >
              {running ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              )}
              Run Discovery
            </Button>
          </div>
        </div>

        {/* Summary line */}
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {preview?.summary ??
            "Set up your search context to start discovering relevant roles."}
        </p>

        {/* Collapsible context section */}
        <div className="mt-4">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setContextOpen((v) => !v)}
          >
            {contextOpen ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            )}
            {contextOpen ? "Hide search context" : "Show search context"}
          </button>

          {contextOpen ? (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 lg:grid-cols-3">
                <ContextChipList
                  label="Skills"
                  items={preview?.effective_skills ?? []}
                  emptyLabel="No skills selected yet."
                  getItemMeta={(item) =>
                    preview?.detected_skills.includes(item)
                      ? "Detected"
                      : preferences?.resume_context_enabled
                        ? "Saved"
                        : "Manual"
                  }
                />
                <ContextChipList
                  label="Role level"
                  items={preview?.effective_role_types ?? []}
                  emptyLabel="No role level selected yet."
                  getItemMeta={(item) =>
                    preview?.detected_role_types.includes(item)
                      ? "Detected"
                      : preferences?.resume_context_enabled
                        ? "Saved"
                        : "Manual"
                  }
                />
                <ContextChipList
                  label="Location"
                  items={preview?.effective_locations ?? []}
                  emptyLabel="No location selected yet."
                  getItemMeta={(item) =>
                    preview?.detected_locations.includes(item)
                      ? "Detected"
                      : preferences?.resume_context_enabled
                        ? "Saved"
                        : "Manual"
                  }
                />
              </div>

              {notePreview ? (
                <div className="rounded-xl border border-border/50 bg-background/40 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{notePreview}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </GlassCard>

      {/* Feedback banner — separate from card for cleaner visual separation */}
      {runFeedback ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-2.5 text-sm",
            runFeedback.tone === "error" && "border-red-500/30 bg-red-500/5 text-red-300",
            runFeedback.tone === "warning" && "border-amber-500/30 bg-amber-500/5 text-amber-200",
            runFeedback.tone === "success" && "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
          )}
          role="status"
          aria-live="polite"
        >
          <p>{runFeedback.message}</p>
          {runFeedback.details.map((detail) => (
            <p key={detail} className="mt-1 text-xs opacity-80">
              {detail}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
};
