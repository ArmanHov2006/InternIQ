"use client";

import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useDiscoverStore } from "@/stores/discover-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PreferencesBarProps {
  onOpenPrefs: () => void;
}

export const PreferencesBar = ({ onOpenPrefs }: PreferencesBarProps) => {
  const preferences = useDiscoverStore((s) => s.preferences);
  const running = useDiscoverStore((s) => s.running);
  const runDiscovery = useDiscoverStore((s) => s.runDiscovery);

  const onRun = async () => {
    const { error, sourceErrors } = await runDiscovery();
    if (error) {
      toast.error(error);
      return;
    }
    if (sourceErrors && Object.keys(sourceErrors).length > 0) {
      toast.message("Some sources had issues; check the console for details.");
      console.warn("Discovery source errors", sourceErrors);
    } else {
      toast.success("Discovery finished.");
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
    </div>
  );
};
