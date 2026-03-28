"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, RefreshCw, ShieldCheck, Wand2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { GlassCard } from "@/components/ui/glass-card";
import { useKanbanStore } from "@/stores/kanban-store";
import type { Application } from "@/types/database";

type Suggestion = {
  id: string;
  application_id: string;
  from_status: string | null;
  to_status: string;
  confidence: number;
  reason: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  created_at: string;
  email_events?: {
    from_email?: string;
    subject?: string;
    snippet?: string;
    received_at?: string;
  } | null;
};

type Connection = {
  id: string;
  provider: "gmail";
  provider_account_email: string;
  automation_mode: "suggestions_only" | "hybrid" | "fully_auto";
  auto_update_threshold: number;
  is_active: boolean;
  watch_expiration: string | null;
  updated_at: string;
};

export default function AutomationPage() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const addOrUpdateFromApplication = useKanbanStore((state) => state.addOrUpdateFromApplication);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [connectionRes, suggestionsRes] = await Promise.all([
        fetch("/api/automation/gmail/connection", { credentials: "same-origin" }),
        fetch("/api/automation/status-suggestions", { credentials: "same-origin" }),
      ]);
      const connectionPayload = (await connectionRes.json()) as {
        connection?: Connection | null;
        error?: string;
        featureDisabled?: boolean;
      };
      const suggestionsPayload = (await suggestionsRes.json()) as Suggestion[] | { error?: string };

      if (!connectionRes.ok) throw new Error(connectionPayload.error || "Could not load Gmail integration.");
      if (!suggestionsRes.ok || !Array.isArray(suggestionsPayload)) {
        throw new Error(
          Array.isArray(suggestionsPayload) ? "Could not load suggestions." : suggestionsPayload.error || "Could not load suggestions."
        );
      }

      setConnection(connectionPayload.connection ?? null);
      setFeatureDisabled(Boolean(connectionPayload.featureDisabled));
      setSuggestions(suggestionsPayload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load automation settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((suggestion) => suggestion.status === "pending"),
    [suggestions]
  );

  const onResolveSuggestion = async (id: string, action: "accept" | "reject") => {
    setBusyId(id);
    try {
      const response = await fetch("/api/automation/status-suggestions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const payload = (await response.json()) as {
        error?: string;
        application?: Application | null;
      };
      if (!response.ok) throw new Error(payload.error || "Could not resolve suggestion.");
      if (payload.application) {
        addOrUpdateFromApplication(payload.application);
      }
      setSuggestions((current) =>
        current.map((suggestion) =>
          suggestion.id === id
            ? { ...suggestion, status: action === "accept" ? "accepted" : "rejected" }
            : suggestion
        )
      );
      toast.success(action === "accept" ? "Suggestion accepted." : "Suggestion rejected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resolve suggestion.");
    } finally {
      setBusyId(null);
    }
  };

  const onDisconnect = async () => {
    setBusyId("disconnect");
    try {
      const response = await fetch("/api/integrations/gmail/disconnect", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not disconnect Gmail.");
      toast.success("Gmail disconnected.");
      await refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disconnect Gmail.");
    } finally {
      setBusyId(null);
    }
  };

  const onEnableWatch = async () => {
    setBusyId("watch");
    try {
      const response = await fetch("/api/integrations/gmail/watch", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not enable Gmail watch.");
      toast.success("Gmail watch enabled.");
      await refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enable Gmail watch.");
    } finally {
      setBusyId(null);
    }
  };

  if (featureDisabled) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-4xl md:text-5xl">Automation</h1>
        <GlassCard className="p-6">
          <p className="text-sm text-muted-foreground">
            Gmail automation is currently disabled by feature flag. Set{" "}
            <code>NEXT_PUBLIC_GMAIL_AUTOMATION_ENABLED=true</code> and <code>GMAIL_AUTOMATION_ENABLED=true</code>{" "}
            to enable rollout.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-4xl md:text-5xl">Automation</h1>
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading Gmail automation state...
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl md:text-5xl">Automation</h1>
      <GlassCard className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Gmail Integration</p>
            <h2 className="mt-1 text-xl font-semibold">Hybrid pipeline automation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Auto-update high-confidence pipeline events and keep uncertain cases for your review.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/automation/debug">
              <MagneticButton variant="outline" className="gap-2">
                Debug
              </MagneticButton>
            </Link>
            <MagneticButton
              variant="outline"
              className="gap-2"
              onClick={() => {
                void refreshData();
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </MagneticButton>
          </div>
        </div>

        {!connection ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-muted-foreground">
              Connect Gmail to turn hiring-related emails into application pipeline updates.
            </p>
            <a href="/api/integrations/gmail/connect" className="mt-3 inline-flex">
              <MagneticButton className="gap-2">
                <Mail className="h-4 w-4" />
                Connect Gmail
              </MagneticButton>
            </a>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-foreground">{connection.provider_account_email}</p>
                <p className="text-xs text-muted-foreground">
                  Mode: <span className="font-medium text-foreground">{connection.automation_mode}</span> • Threshold:{" "}
                  <span className="font-medium text-foreground">{connection.auto_update_threshold.toFixed(2)}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MagneticButton
                  variant="outline"
                  className="gap-2"
                  onClick={onEnableWatch}
                  disabled={busyId === "watch"}
                >
                  <Wand2 className="h-4 w-4" />
                  {busyId === "watch" ? "Enabling..." : "Enable Watch"}
                </MagneticButton>
                <MagneticButton
                  variant="outline"
                  className="gap-2"
                  onClick={onDisconnect}
                  disabled={busyId === "disconnect"}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {busyId === "disconnect" ? "Disconnecting..." : "Disconnect"}
                </MagneticButton>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-white/10 px-2 py-0.5">
                Watch expires: {connection.watch_expiration ? new Date(connection.watch_expiration).toLocaleString() : "not set"}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-0.5">
                Pending suggestions: {pendingSuggestions.length}
              </span>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Status Suggestions</h2>
          <span className="text-sm text-muted-foreground">{pendingSuggestions.length} pending</span>
        </div>

        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Gmail suggestions yet.</p>
          ) : null}

          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {suggestion.from_status ?? "unknown"} → {suggestion.to_status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confidence {(suggestion.confidence * 100).toFixed(0)}% • {new Date(suggestion.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {suggestion.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{suggestion.reason}</p>
              {suggestion.email_events ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  From {suggestion.email_events.from_email ?? "unknown"} • {suggestion.email_events.subject ?? "No subject"}
                </p>
              ) : null}
              {suggestion.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <MagneticButton
                    size="sm"
                    className="h-8"
                    disabled={busyId === suggestion.id}
                    onClick={() => {
                      void onResolveSuggestion(suggestion.id, "accept");
                    }}
                  >
                    Accept
                  </MagneticButton>
                  <MagneticButton
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={busyId === suggestion.id}
                    onClick={() => {
                      void onResolveSuggestion(suggestion.id, "reject");
                    }}
                  >
                    Reject
                  </MagneticButton>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
