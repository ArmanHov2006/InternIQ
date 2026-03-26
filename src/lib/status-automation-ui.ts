import { STATUS_LABELS, resolveApplicationStatus } from "@/lib/constants";
import type { Application } from "@/types/database";

export const getSourceBadge = (application: Application) => {
  if (application.status_source === "email_auto") {
    return { label: "Email Auto", className: "bg-cyan-500/10 text-cyan-700 border-cyan-400/30 dark:text-cyan-300" };
  }
  if (application.status_source === "email_suggested" || application.suggestion_pending) {
    return { label: "Email Suggestion", className: "bg-amber-500/10 text-amber-700 border-amber-400/30 dark:text-amber-300" };
  }
  return { label: "Manual", className: "bg-muted text-muted-foreground border-border" };
};

export const parseSuggestedStatusFromEvidence = (evidence: string | null | undefined) => {
  if (!evidence || !evidence.startsWith("suggested:")) return null;
  const [head] = evidence.split("|");
  const raw = head.replace("suggested:", "");
  const status = resolveApplicationStatus(raw);
  if (!status) return null;
  return { status, label: STATUS_LABELS[status] };
};

export const friendlyTimeAgo = (iso: string | null | undefined) => {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
