"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { MagneticButton } from "@/components/ui/magnetic-button";

type EventRow = {
  id: string;
  provider_message_id: string;
  from_email: string;
  subject: string;
  normalized_signal: string;
  proposed_status: string | null;
  confidence: number | null;
  processing_status: string;
  processing_attempts: number;
  last_error: string;
  created_at: string;
  processed_at: string | null;
};

export default function AutomationDebugPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchEvents = async () => {
    const response = await fetch("/api/automation/gmail/events", { credentials: "same-origin" });
    const payload = (await response.json()) as EventRow[] | { error?: string };
    if (!response.ok || !Array.isArray(payload)) {
      throw new Error(Array.isArray(payload) ? "Could not load events." : payload.error || "Could not load events.");
    }
    setEvents(payload);
  };

  useEffect(() => {
    void fetchEvents().catch((error) => {
      toast.error(error instanceof Error ? error.message : "Could not load events.");
    });
  }, []);

  const replayEvent = async (eventId: string) => {
    setBusyId(eventId);
    try {
      const response = await fetch("/api/automation/gmail/replay", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Replay failed.");
      toast.success("Replay queued successfully.");
      await fetchEvents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Replay failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl md:text-5xl">Automation Debug</h1>
      <GlassCard className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Inspect dead-letter events and replay failed Gmail processing runs.
          </p>
          <MagneticButton
            variant="outline"
            className="gap-2"
            onClick={() => {
              void fetchEvents().catch((error) => {
                toast.error(error instanceof Error ? error.message : "Could not refresh events.");
              });
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </MagneticButton>
        </div>

        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ingestion events recorded yet.</p>
          ) : null}
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{event.subject || "(No subject)"}</p>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {event.processing_status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {event.from_email} • signal {event.normalized_signal} • confidence{" "}
                {event.confidence === null ? "n/a" : `${Math.round(event.confidence * 100)}%`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Attempts {event.processing_attempts} • {new Date(event.created_at).toLocaleString()}
              </p>
              {event.last_error ? (
                <p className="mt-2 flex items-start gap-2 text-xs text-rose-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                  {event.last_error}
                </p>
              ) : null}
              <div className="mt-3">
                <MagneticButton
                  size="sm"
                  variant="outline"
                  className="h-8 gap-2"
                  disabled={busyId === event.id}
                  onClick={() => {
                    void replayEvent(event.id);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {busyId === event.id ? "Replaying..." : "Replay"}
                </MagneticButton>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
