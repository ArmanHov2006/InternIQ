import { describe, expect, it } from "vitest";
import {
  formatRunFeedback,
  getDiscoverEmptyState,
} from "@/lib/services/discovery/run-feedback";
import type { DiscoveryRunDiagnostics } from "@/types/database";

const diagnostics = (
  overrides: Partial<DiscoveryRunDiagnostics> = {}
): DiscoveryRunDiagnostics => ({
  reasonCode: "score_threshold_filtered_out",
  secondaryIssues: [],
  effectiveContext: {
    locations: ["Toronto"],
    remote_preference: "any",
    role_types: ["intern", "junior"],
  },
  executedContext: {
    keywords: ["Python", "FastAPI", "Redis"],
    locations: ["Toronto"],
    source_query_locations: ["Toronto", "Remote"],
    role_types: ["intern", "junior"],
    remote_preference: "any",
  },
  stageCounts: {
    fetched: 15,
    afterRemote: 15,
    afterLocation: 15,
    afterSeniority: 15,
    afterThreshold: 0,
    active: 0,
    inserted: 0,
    updated: 0,
    reactivated: 0,
  },
  sourceStats: {
    himalayas: {
      count: 0,
      durationMs: 12000,
      timedOut: true,
      error: "Himalayas HTTP 522",
    },
  },
  ...overrides,
});

describe("discovery run feedback", () => {
  it("combines threshold and source outage messaging into one banner", () => {
    const feedback = formatRunFeedback({
      diagnostics: diagnostics({
        secondaryIssues: ["source_errors"],
      }),
      minMatchScore: 55,
      reviewed: 15,
      visible: 0,
      hidden: 0,
      inserted: 0,
      updated: 0,
      reactivated: 0,
      sourceErrors: {
        himalayas: "Himalayas HTTP 522",
      },
    });

    expect(feedback.tone).toBe("warning");
    expect(feedback.message).toContain("none cleared your 55% shortlist threshold");
    expect(feedback.message).toContain("Himalayas was unavailable");
    expect(feedback.details[0]).toContain("Executed context");
  });

  it("uses the post-run empty state once a real discovery run returned no shortlist", () => {
    const emptyState = getDiscoverEmptyState({
      latestRunSummary: {
        reviewedCount: 15,
        diagnostics: diagnostics({
          secondaryIssues: ["source_errors"],
        }),
        sourceErrors: {
          himalayas: "Himalayas HTTP 522",
        },
      },
      minMatchScore: 55,
    });

    expect(emptyState.title).toBe("No jobs cleared your current shortlist threshold in the last run");
    expect(emptyState.description).toContain("15 roles");
    expect(emptyState.description).toContain("55% shortlist threshold");
    expect(emptyState.description).toContain("Himalayas was unavailable");
  });

  it("keeps the pre-run empty state only when discovery has not run yet", () => {
    const emptyState = getDiscoverEmptyState({
      latestRunSummary: null,
      minMatchScore: 55,
    });

    expect(emptyState.title).toBe("No discovered jobs yet");
  });
});
