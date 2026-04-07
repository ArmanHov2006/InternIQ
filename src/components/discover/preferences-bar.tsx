"use client";

import { useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useDiscoverStore } from "@/stores/discover-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PreferencesBarProps {
  onOpenPrefs: () => void;
}

type RunFeedback = {
  tone: "success" | "warning" | "error";
  message: string;
  sourceErrors?: Record<string, string>;
};

export const PreferencesBar = ({ onOpenPrefs }: PreferencesBarProps) => {
  const preferences = useDiscoverStore((s) => s.preferences);
  const running = useDiscoverStore((s) => s.running);
  const runDiscovery = useDiscoverStore((s) => s.runDiscovery);
  const [runFeedback, setRunFeedback] = useState<RunFeedback | null>(null);

  const onRun = async () => {
    setRunFeedback(null);
    const { error, sourceErrors, resultsCount, newOpportunitiesCount } = await runDiscovery();
    if (error) {
      setRunFeedback({ tone: "error", message: error, sourceErrors });
      toast.error(error);
      return;
    }
    if ((resultsCount ?? 0) > 0 && (newOpportunitiesCount ?? 0) === 0) {
      const message = `Fetched ${resultsCount} job${resultsCount === 1 ? "" : "s"}, but none became new opportunities. They may have been filtered out by your minimum match score, narrowed role types, missing Greenhouse slugs, or already existed.`;
      setRunFeedback({ tone: "warning", message, sourceErrors });
      toast.message(message);
      return;
    }
    if (sourceErrors && Object.keys(sourceErrors).length > 0) {
      const inserted = newOpportunitiesCount ?? 0;
      setRunFeedback({
        tone: "warning",
        message: `Added ${inserted} new job${inserted === 1 ? "" : "s"}, but some sources returned issues.`,
        sourceErrors,
      });
      toast.message("Some sources had issues; check the console for details.");
      console.warn("Discovery source errors", sourceErrors);
    } else {
      const inserted = newOpportunitiesCount ?? 0;
      setRunFeedback({
        tone: "success",
        message:
          inserted > 0
            ? `Discovery finished. Added ${inserted} new job${inserted === 1 ? "" : "s"}.`
            : "Discovery finished.",
      });
      toast.success(
        inserted > 0
          ? `Discovery finished. Added ${inserted} new job${inserted === 1 ? "" : "s"}.`
          : "Discovery finished."
      );
    }
  };

  const last = preferences?.last_discovery_at
    ? new Date(preferences.last_discovery_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Preferences</p>
          <div className="flex flex-wrap gap-1.5">
            {(preferences?.keywords?.length ? preferences.keywords : ["Add keywords"]).map((k) => (
              <Badge key={k} variant="secondary" className="font-normal">
                {k}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(preferences?.locations?.length ? preferences.locations : ["Any location"]).map((k) => (
              <Badge key={k} variant="outline" className="font-normal">
                {k}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Remote: <span className="font-mono text-foreground">{preferences?.remote_preference ?? "any"}</span>
            {last ? (
              <>
                {" "}
                · Last run: <span className="font-mono text-foreground">{last}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onOpenPrefs}>
            <Settings2 className="mr-1.5 h-4 w-4" aria-hidden />
            Edit
          </Button>
          <Button type="button" size="sm" disabled={running} onClick={onRun} className={cn(running && "gap-2")}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Run Discovery
          </Button>
        </div>
      </div>

      {runFeedback ? (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            runFeedback.tone === "error" && "border-rose-500/30 bg-rose-500/10 text-rose-100",
            runFeedback.tone === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-100",
            runFeedback.tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          )}
        >
          <p>{runFeedback.message}</p>
          {runFeedback.sourceErrors && Object.keys(runFeedback.sourceErrors).length > 0 ? (
            <p className="mt-1 text-xs opacity-90">
              Source issues:{" "}
              {Object.entries(runFeedback.sourceErrors)
                .map(([source, message]) => `${source}: ${message}`)
                .join(" | ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
