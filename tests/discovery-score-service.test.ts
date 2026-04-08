import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Opportunity } from "@/types/database";

const {
  getResumeAndKeywordsMock,
  parseStoredAiMock,
  scoreJobSnippetsWithClaudeMock,
} = vi.hoisted(() => ({
  getResumeAndKeywordsMock: vi.fn(),
  parseStoredAiMock: vi.fn(),
  scoreJobSnippetsWithClaudeMock: vi.fn(),
}));

vi.mock("@/lib/server/resume-keywords", () => ({
  getResumeAndKeywords: getResumeAndKeywordsMock,
}));

vi.mock("@/lib/services/discovery/ai-scorer", () => ({
  parseStoredAi: parseStoredAiMock,
  scoreJobSnippetsWithClaude: scoreJobSnippetsWithClaudeMock,
}));

import { scoreDiscoveryShortlistForUser } from "@/lib/services/discovery/score-discovery";

type QueryFilters = {
  eq: Array<[string, unknown]>;
  notNull: string[];
  orders: string[];
};

const makeOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: overrides.id ?? "opp-1",
  user_id: overrides.user_id ?? "user-1",
  company: overrides.company ?? "Acme",
  role: overrides.role ?? "Backend Intern",
  location: overrides.location ?? "Toronto",
  board: overrides.board ?? "Greenhouse",
  source: overrides.source ?? "recommendation",
  job_url: overrides.job_url ?? "https://example.com/jobs/1",
  external_job_id: overrides.external_job_id ?? "job-1",
  salary_range: overrides.salary_range ?? "",
  status: overrides.status ?? "new",
  employment_type: overrides.employment_type ?? "Remote",
  job_description: overrides.job_description ?? "Build Python and FastAPI services.",
  match_score: overrides.match_score ?? 84,
  match_summary: overrides.match_summary ?? "",
  matched_keywords: overrides.matched_keywords ?? ["python", "fastapi"],
  missing_keywords: overrides.missing_keywords ?? [],
  application_id: overrides.application_id ?? null,
  created_at: overrides.created_at ?? "2026-04-05T10:00:00.000Z",
  updated_at: overrides.updated_at ?? "2026-04-05T10:00:00.000Z",
  api_source: overrides.api_source ?? "jobicy",
  api_job_id: overrides.api_job_id ?? "job-1",
  discovery_run_id: overrides.discovery_run_id ?? "run-1",
  ai_score: overrides.ai_score ?? {},
  posted_at: overrides.posted_at ?? "2026-04-05T10:00:00.000Z",
  discovery_last_seen_at: overrides.discovery_last_seen_at,
  discovery_missed_runs: overrides.discovery_missed_runs,
  discovery_is_stale: overrides.discovery_is_stale,
});

const createSelectChain = (
  rows: Opportunity[],
  onApply: (filters: QueryFilters) => { data: unknown; error: unknown }
) => {
  const filters: QueryFilters = { eq: [], notNull: [], orders: [] };
  const chain = {
    eq(key: string, value: unknown) {
      filters.eq.push([key, value]);
      return chain;
    },
    not(key: string, operator: string, value: unknown) {
      if (operator === "is" && value === null) {
        filters.notNull.push(key);
      }
      return chain;
    },
    order(column: string) {
      filters.orders.push(column);
      return chain;
    },
    limit(_value: number) {
      return Promise.resolve(onApply(filters));
    },
    then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
      onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
      try {
        const result = onApply(filters);
        return Promise.resolve(onfulfilled ? onfulfilled(result) : (result as TResult1));
      } catch (error) {
        if (onrejected) {
          return Promise.resolve(onrejected(error));
        }
        return Promise.reject(error);
      }
    },
  };
  return chain;
};

describe("scoreDiscoveryShortlistForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parseStoredAiMock.mockReturnValue(null);
    getResumeAndKeywordsMock.mockResolvedValue({
      resumeText: "Built Python services.",
      profileKeywords: ["python", "fastapi"],
      profileContextText: "Python backend engineer.",
    });
    scoreJobSnippetsWithClaudeMock.mockResolvedValue(
      new Map([
        [
          "opp-1",
          {
            final_score: 90,
            subscores: {
              must_have: 90,
              seniority: 90,
              skills: 90,
              logistics: 90,
              upside: 90,
            },
            evidence: ["Strong match."],
            gaps: [],
            gating_flags: [],
            reasoning: "Good fit.",
          },
        ],
      ])
    );
  });

  it("falls back when stale-order columns are unavailable", async () => {
    const rows = [makeOpportunity()];
    const updates: Array<Record<string, unknown>> = [];

    const supabase = {
      from: (table: string) => {
        if (table === "discovery_runs") {
          return {
            select: () =>
              createSelectChain([], () => ({
                data: [{ id: "run-1" }],
                error: null,
              })),
            update: (payload: Record<string, unknown>) => ({
              eq: () => ({
                eq: async () => {
                  updates.push(payload);
                  return { error: null };
                },
              }),
            }),
          };
        }

        if (table === "opportunities") {
          return {
            select: () =>
              createSelectChain(rows, ({ orders }) => {
                if (orders.includes("discovery_is_stale")) {
                  return {
                    data: null,
                    error: { message: "column opportunities.discovery_is_stale does not exist", code: "42703" },
                  };
                }
                return { data: rows, error: null };
              }),
            update: (payload: Record<string, unknown>) => ({
              eq: () => ({
                eq: async () => {
                  updates.push(payload);
                  return { error: null };
                },
              }),
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient;

    const result = await scoreDiscoveryShortlistForUser(supabase, "user-1", { runId: "run-1" });

    expect(result).toMatchObject({
      runId: "run-1",
      scored: 1,
      candidates: 1,
      remaining: 0,
      done: true,
    });
    expect(scoreJobSnippetsWithClaudeMock).toHaveBeenCalledTimes(1);
    expect(updates.some((payload) => "ai_score" in payload)).toBe(true);
  });
});
