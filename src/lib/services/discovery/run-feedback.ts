import type { DiscoveryRunDiagnostics } from "@/types/database";

export type RunFeedback = {
  tone: "success" | "warning" | "error";
  message: string;
  details: string[];
  sourceErrors?: Record<string, string>;
};

type EmptyStateCopy = {
  title: string;
  description: string;
};

const formatList = (values: string[], fallback: string): string => {
  if (values.length === 0) return fallback;
  if (values.length === 1) return values[0]!;
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, 2).join(", ")}, and ${values[2]}`;
};

const prettifySourceName = (source: string): string =>
  source
    .split(/[_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const summarizeSourceIssues = (sourceErrors?: Record<string, string>): string | null => {
  if (!sourceErrors || Object.keys(sourceErrors).length === 0) return null;

  const summaries = Object.entries(sourceErrors).map(([source, message]) => {
    const label = prettifySourceName(source);
    if (/timed out/i.test(message) || /HTTP 52\d/i.test(message) || /HTTP 5\d\d/i.test(message)) {
      return `${label} was unavailable`;
    }
    return `${label} had issues`;
  });

  if (summaries.length === 1) return summaries[0]!;
  if (summaries.length === 2) return `${summaries[0]} and ${summaries[1]}`;
  return `${summaries[0]}, ${summaries[1]}, and ${summaries.length - 2} other sources had issues`;
};

export const formatExecutedContext = (
  diagnostics?: DiscoveryRunDiagnostics
): string | null => {
  if (!diagnostics) return null;

  const { executedContext } = diagnostics;
  const keywords = formatList(executedContext.keywords.slice(0, 4), "broad discovery terms");
  const locations =
    executedContext.source_query_locations.length > 0
      ? formatList(executedContext.source_query_locations, "broad locations")
      : "broad locations";
  const roleTypes = formatList(executedContext.role_types, "general roles");

  return `Executed context: ${keywords} in ${locations} for ${roleTypes} roles (${executedContext.remote_preference.replace("_", " ")}).`;
};

export const formatRunFeedback = (input: {
  diagnostics?: DiscoveryRunDiagnostics;
  minMatchScore: number;
  reviewed: number;
  visible: number;
  hidden: number;
  inserted: number;
  updated: number;
  reactivated: number;
  sourceErrors?: Record<string, string>;
}): RunFeedback => {
  const diagnostics = input.diagnostics;
  const sourceIssueSummary = summarizeSourceIssues(input.sourceErrors);
  const details = [
    formatExecutedContext(diagnostics),
    input.sourceErrors && Object.keys(input.sourceErrors).length > 0
      ? `Source issues: ${Object.entries(input.sourceErrors)
          .map(([source, message]) => `${source}: ${message}`)
          .join(" | ")}`
      : null,
  ].filter((detail): detail is string => Boolean(detail));

  if (input.visible === 0 && diagnostics) {
    const { stageCounts } = diagnostics;
    let message = "";

    if (diagnostics.reasonCode === "location_filtered_out") {
      const candidatePool = stageCounts.afterRemote || stageCounts.fetched;
      message =
        candidatePool > 0
          ? `Reviewed ${candidatePool} roles, but location filters removed them before shortlist scoring.`
          : "Location filters removed every role before shortlist scoring.";
    } else if (diagnostics.reasonCode === "seniority_filtered_out") {
      message = `Reviewed ${stageCounts.afterLocation} roles, but seniority filters removed them before shortlist scoring.`;
    } else if (diagnostics.reasonCode === "score_threshold_filtered_out") {
      message = `Reviewed ${stageCounts.afterSeniority} roles, but none cleared your ${input.minMatchScore}% shortlist threshold.`;
    } else if (diagnostics.reasonCode === "all_refreshed") {
      message =
        "This run refreshed previously matched jobs, but none stayed in the active shortlist because they were already saved or applied.";
    } else if (diagnostics.reasonCode === "source_errors") {
      message = "Discovery could not produce a shortlist because one or more sources were unavailable.";
    } else if (diagnostics.reasonCode === "no_source_results") {
      message = "No jobs came back from the configured sources for this search context.";
    }

    if (
      sourceIssueSummary &&
      (diagnostics.secondaryIssues.includes("source_errors") ||
        diagnostics.reasonCode === "source_errors")
    ) {
      message = `${message} ${sourceIssueSummary}.`;
    }

    return {
      tone: "warning",
      message,
      details,
      sourceErrors: input.sourceErrors,
    };
  }

  const deltaParts = [
    input.inserted > 0 ? `${input.inserted} new` : null,
    input.updated > 0 ? `${input.updated} refreshed` : null,
    input.reactivated > 0 ? `${input.reactivated} reactivated` : null,
  ].filter(Boolean);
  const suffix = deltaParts.length > 0 ? ` (${deltaParts.join(", ")})` : "";

  const successMessage =
    input.reviewed > 0
      ? `Reviewed ${input.reviewed} roles, showing ${input.visible} active matches and hiding ${input.hidden} previous or low-fit results${suffix}.`
      : "Discovery ran successfully with your saved context.";

  return {
    tone: sourceIssueSummary ? "warning" : "success",
    message: sourceIssueSummary ? `${successMessage} ${sourceIssueSummary}.` : successMessage,
    details,
    sourceErrors: input.sourceErrors,
  };
};

export const getDiscoverEmptyState = (input: {
  latestRunSummary?: {
    reviewedCount: number;
    sourceErrors?: Record<string, string>;
    diagnostics?: DiscoveryRunDiagnostics;
  } | null;
  minMatchScore: number;
}): EmptyStateCopy => {
  const latestRun = input.latestRunSummary;
  const diagnostics = latestRun?.diagnostics;

  if (diagnostics && diagnostics.reasonCode === "all_refreshed") {
    return {
      title: "No active shortlist items right now",
      description:
        "The latest run refreshed roles that were already saved or applied, so nothing stayed in Discover as a new shortlist item.",
    };
  }

  if (latestRun && (latestRun.reviewedCount > 0 || diagnostics)) {
    const sourceIssueSummary = summarizeSourceIssues(latestRun.sourceErrors);
    let description = `The latest run reviewed ${latestRun.reviewedCount} roles.`;

    if (diagnostics?.reasonCode === "score_threshold_filtered_out") {
      description = `The latest run reviewed ${diagnostics.stageCounts.afterSeniority} roles, but none cleared your ${input.minMatchScore}% shortlist threshold.`;
    } else if (diagnostics?.reasonCode === "location_filtered_out") {
      description =
        "The latest run found candidates, but your current location filters removed them before shortlist scoring.";
    } else if (diagnostics?.reasonCode === "source_errors") {
      description = "The latest run could not produce a shortlist because one or more sources were unavailable.";
    }

    if (sourceIssueSummary) {
      description = `${description} ${sourceIssueSummary}.`;
    }

    return {
      title: "No jobs cleared your current shortlist threshold in the last run",
      description,
    };
  }

  return {
    title: "No discovered jobs yet",
    description:
      "Run Discovery to scan multiple job sources, or adjust your search context to cast a wider net.",
  };
};
