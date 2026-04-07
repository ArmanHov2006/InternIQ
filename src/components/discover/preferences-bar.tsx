"use client";

import { useMemo, useState } from "react";
import { FileText, Loader2, Settings2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useDiscoverStore } from "@/stores/discover-store";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ContextChipList } from "./context-chip-editor";

interface PreferencesBarProps {
  onOpenPrefs: () => void;
  onOpenAdvanced: () => void;
}

type RunFeedback = {
  tone: "success" | "warning" | "error";
  message: string;
  sourceErrors?: Record<string, string>;
};

const getResumeStatus = (hasResume: boolean, enabled: boolean): { label: string; tone: string } => {
  if (!hasResume) return { label: "No resume detected", tone: "warning" };
  if (!enabled) return { label: "Resume context off", tone: "muted" };
  return { label: "Using your latest resume", tone: "success" };
};

export const PreferencesBar = ({ onOpenPrefs, onOpenAdvanced }: PreferencesBarProps) => {
  const preferences = useDiscoverStore((s) => s.preferences);
  const running = useDiscoverStore((s) => s.running);
  const runDiscovery = useDiscoverStore((s) => s.runDiscovery);
  const [runFeedback, setRunFeedback] = useState<RunFeedback | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const preview = preferences?.resume_context_preview;
  const overrides = preferences?.resume_context_overrides;
  const status = getResumeStatus(Boolean(preview?.has_resume), Boolean(preferences?.resume_context_enabled));

  const onRun = async () => {
    setRunFeedback(null);
    const { error, sourceErrors, resultsCount, newOpportunitiesCount } = await runDiscovery();
    if (error) {
      setRunFeedback({ tone: "error", message: error, sourceErrors });
      setLiveMessage(error);
      toast.error(error);
      return;
    }

    const inserted = newOpportunitiesCount ?? 0;
    if ((resultsCount ?? 0) > 0 && inserted === 0) {
      const message = `Discovery reviewed ${resultsCount} roles, but none matched your current context closely enough to save.`;
      setRunFeedback({ tone: "warning", message, sourceErrors });
      setLiveMessage(message);
      return;
    }

    if (sourceErrors && Object.keys(sourceErrors).length > 0) {
      const reviewed = resultsCount ?? inserted;
      const message = `Discovery reviewed ${reviewed} roles and saved ${inserted} match${inserted === 1 ? "" : "es"}. Some sources had issues.`;
      setRunFeedback({
        tone: "warning",
        message,
        sourceErrors,
      });
      setLiveMessage(message);
      return;
    }

    const reviewed = resultsCount ?? inserted;
    const message =
      inserted > 0
        ? `Discovery reviewed ${reviewed} roles and saved ${inserted} strong match${inserted === 1 ? "" : "es"}.`
        : "Discovery ran with your saved context.";
    setRunFeedback({ tone: "success", message });
    setLiveMessage(message);
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
    <div className="space-y-3">
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>

      <GlassCard className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  status.tone === "success" && "bg-emerald-500/10 text-emerald-300",
                  status.tone === "warning" && "bg-amber-500/10 text-amber-200"
                )}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {status.label}
              </Badge>
              {lastRun ? (
                <span className="text-xs text-muted-foreground">Last run: {lastRun}</span>
              ) : (
                <span className="text-xs text-muted-foreground">No discovery run yet</span>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Search setup</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Start from your resume, then make it yours.
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {preview?.summary ??
                  "Discover can suggest context from your resume and profile, then you can adjust it before you search."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button type="button" size="lg" disabled={running} onClick={onRun}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Run Discovery
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={onOpenPrefs}>
              <Settings2 className="mr-2 h-4 w-4" aria-hidden />
              Edit context
            </Button>
            <Button type="button" size="lg" variant="ghost" onClick={onOpenAdvanced}>
              <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden />
              Advanced filters
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
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
          <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Notes for search</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{notePreview}</p>
          </div>
        ) : null}

        {runFeedback ? (
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              runFeedback.tone === "error" && "border-rose-500/30 bg-rose-500/10 text-rose-100",
              runFeedback.tone === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-100",
              runFeedback.tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            )}
            role="status"
            aria-live="polite"
          >
            <p>{runFeedback.message}</p>
            {runFeedback.sourceErrors && Object.keys(runFeedback.sourceErrors).length > 0 ? (
              <p className="mt-2 text-xs opacity-90">
                Source issues:{" "}
                {Object.entries(runFeedback.sourceErrors)
                  .map(([source, message]) => `${source}: ${message}`)
                  .join(" | ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
};
