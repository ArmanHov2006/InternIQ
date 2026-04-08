import { describe, expect, it } from "vitest";
import { selectFilteredOpportunities } from "@/stores/discover-store";
import type { Opportunity } from "@/types/database";

const makeOpportunity = (overrides: Partial<Opportunity>): Opportunity => ({
  id: overrides.id ?? crypto.randomUUID(),
  user_id: "user-1",
  company: overrides.company ?? "Acme",
  role: overrides.role ?? "Engineer",
  location: overrides.location ?? "Remote",
  board: overrides.board ?? "Greenhouse",
  source: overrides.source ?? "recommendation",
  job_url: overrides.job_url ?? "https://example.com/jobs/1",
  external_job_id: overrides.external_job_id ?? "job-1",
  salary_range: overrides.salary_range ?? "",
  status: overrides.status ?? "new",
  employment_type: overrides.employment_type ?? "Remote",
  job_description: overrides.job_description ?? "Build backend systems.",
  match_score: overrides.match_score ?? 70,
  match_summary: overrides.match_summary ?? "",
  matched_keywords: overrides.matched_keywords ?? [],
  missing_keywords: overrides.missing_keywords ?? [],
  application_id: overrides.application_id ?? null,
  created_at: overrides.created_at ?? "2026-04-05T10:00:00.000Z",
  updated_at: overrides.updated_at ?? "2026-04-05T10:00:00.000Z",
  api_source: overrides.api_source ?? "jobicy",
  api_job_id: overrides.api_job_id ?? overrides.external_job_id ?? "job-1",
  discovery_run_id: overrides.discovery_run_id ?? "run-1",
  ai_score: overrides.ai_score ?? {},
  posted_at: overrides.posted_at ?? "2026-04-05T10:00:00.000Z",
  discovery_last_seen_at: overrides.discovery_last_seen_at ?? "2026-04-05T10:00:00.000Z",
  discovery_missed_runs: overrides.discovery_missed_runs ?? 0,
  discovery_is_stale: overrides.discovery_is_stale ?? false,
});

describe("selectFilteredOpportunities", () => {
  it("keeps only active shortlist rows and sorts by the primary score", () => {
    const rows = [
      makeOpportunity({
        id: "ai-low",
        match_score: 92,
        ai_score: {
          final_score: 74,
          subscores: {
            must_have: 74,
            seniority: 70,
            skills: 78,
            logistics: 72,
            upside: 70,
          },
          evidence: ["Needs review."],
          gaps: ["A few gaps."],
          gating_flags: [],
          reasoning: "Worth considering.",
        },
      }),
      makeOpportunity({
        id: "heuristic-high",
        match_score: 83,
      }),
      makeOpportunity({
        id: "archived",
        status: "archived",
        match_score: 99,
      }),
      makeOpportunity({
        id: "saved",
        status: "saved",
        application_id: "app-1",
        match_score: 98,
      }),
    ];

    const sorted = selectFilteredOpportunities(rows, "all", "match");

    expect(sorted.map((row) => row.id)).toEqual(["heuristic-high", "ai-low"]);
  });

  it("removes saved rows from the visible shortlist immediately", () => {
    const rows = [
      makeOpportunity({ id: "saved", status: "saved", application_id: "app-1" }),
      makeOpportunity({ id: "new", status: "new" }),
      makeOpportunity({ id: "archived-saved", status: "archived", application_id: "app-2" }),
    ];

    const shortlist = selectFilteredOpportunities(rows, "all", "match");

    expect(shortlist.map((row) => row.id)).toEqual(["new"]);
  });

  it("keeps stale discovery rows visible but sorts fresh rows first", () => {
    const rows = [
      makeOpportunity({ id: "stale-best", match_score: 99, discovery_is_stale: true }),
      makeOpportunity({ id: "fresh-good", match_score: 82, discovery_is_stale: false }),
      makeOpportunity({ id: "fresh-mid", match_score: 75, discovery_is_stale: false }),
    ];

    const shortlist = selectFilteredOpportunities(rows, "all", "match");

    expect(shortlist.map((row) => row.id)).toEqual(["fresh-good", "fresh-mid", "stale-best"]);
  });
});
