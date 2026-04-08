import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Opportunity } from "@/types/database";
import { resolveDiscoveryScope } from "@/lib/server/opportunities-route";

const { withAuthMock, isSchemaCompatErrorMock } = vi.hoisted(() => ({
  withAuthMock: vi.fn(),
  isSchemaCompatErrorMock: vi.fn(),
}));

vi.mock("@/lib/server/route-utils", () => ({
  isSupabaseConfigured: true,
  withAuth: withAuthMock,
}));

vi.mock("@/lib/server/schema-compat", () => ({
  isSchemaCompatError: isSchemaCompatErrorMock,
}));

import { GET } from "@/app/api/opportunities/route";

type FilterState = {
  eq: Array<[string, unknown]>;
  notNull: string[];
};

const createFilterState = (): FilterState => ({
  eq: [],
  notNull: [],
});

const applyFilters = (rows: Opportunity[], filters: FilterState): Opportunity[] =>
  rows.filter((row) => {
    if (
      filters.eq.some(([key, value]) => {
        return (row as unknown as Record<string, unknown>)[key] !== value;
      })
    ) {
      return false;
    }
    if (
      filters.notNull.some((key) => {
        return (row as unknown as Record<string, unknown>)[key] == null;
      })
    ) {
      return false;
    }
    return true;
  });

const createPromiseChain = <T>(apply: (filters: FilterState) => T) => {
  const filters = createFilterState();
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
    order() {
      return chain;
    },
    limit(_count: number) {
      return Promise.resolve(apply(filters));
    },
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
      try {
        const result = apply(filters);
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

const makeOpportunity = (overrides: Partial<Opportunity>): Opportunity => ({
  id: overrides.id ?? crypto.randomUUID(),
  user_id: overrides.user_id ?? "user-1",
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
  api_job_id: overrides.api_job_id ?? "job-1",
  discovery_run_id: overrides.discovery_run_id ?? "run-1",
  ai_score: overrides.ai_score ?? {},
  posted_at: overrides.posted_at ?? "2026-04-05T10:00:00.000Z",
  discovery_last_seen_at: overrides.discovery_last_seen_at ?? "2026-04-05T10:00:00.000Z",
  discovery_missed_runs: overrides.discovery_missed_runs ?? 0,
  discovery_is_stale: overrides.discovery_is_stale ?? false,
});

describe("opportunities discovery scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSchemaCompatErrorMock.mockReturnValue(false);
  });

  it("parses the latest shortlist discovery scope", () => {
    expect(
      resolveDiscoveryScope(
        new Request("http://localhost/api/opportunities?discovery_scope=latest_shortlist")
      )
    ).toBe("latest_shortlist");
    expect(
      resolveDiscoveryScope(
        new Request("http://localhost/api/opportunities?discovery_scope=active_discovered")
      )
    ).toBe("active_discovered");
    expect(resolveDiscoveryScope(new Request("http://localhost/api/opportunities"))).toBeNull();
  });

  it("returns only latest-run active shortlist opportunities", async () => {
    const runRows = [{ id: "run-latest" }];
    const opportunityRows = [
      makeOpportunity({ id: "latest-new", discovery_run_id: "run-latest", status: "new" }),
      makeOpportunity({
        id: "latest-saved",
        discovery_run_id: "run-latest",
        status: "saved",
        application_id: "app-1",
      }),
      makeOpportunity({ id: "old-new", discovery_run_id: "run-old", status: "new" }),
      makeOpportunity({ id: "manual", source: "manual", api_source: null, api_job_id: null }),
    ];

    const supabase = {
      from: (table: string) => {
        if (table === "discovery_runs") {
          return {
            select: () =>
              createPromiseChain(() => ({
                data: runRows,
                error: null,
              })),
          };
        }

        if (table === "opportunities") {
          return {
            select: () =>
              createPromiseChain((filters) => ({
                data: applyFilters(opportunityRows, filters),
                error: null,
              })),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    };

    withAuthMock.mockResolvedValue({
      supabase,
      user: { id: "user-1" },
    });

    const response = await GET(
      new Request("http://localhost/api/opportunities?discovery_scope=latest_shortlist")
    );
    const data = (await response.json()) as Opportunity[];

    expect(response.status).toBe(200);
    expect(data.map((row) => row.id)).toEqual(["latest-new"]);
  });

  it("returns active discovered jobs across runs with fresh rows first", async () => {
    const opportunityRows = [
      makeOpportunity({ id: "fresh", discovery_run_id: "run-latest", status: "new", discovery_is_stale: false }),
      makeOpportunity({ id: "stale", discovery_run_id: "run-old", status: "new", discovery_is_stale: true }),
      makeOpportunity({ id: "saved", discovery_run_id: "run-latest", status: "saved", application_id: "app-1" }),
    ];

    const supabase = {
      from: (table: string) => {
        if (table === "opportunities") {
          return {
            select: () =>
              createPromiseChain((filters) => ({
                data: applyFilters(opportunityRows, filters),
                error: null,
              })),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    };

    withAuthMock.mockResolvedValue({
      supabase,
      user: { id: "user-1" },
    });

    const response = await GET(
      new Request("http://localhost/api/opportunities?discovery_scope=active_discovered")
    );
    const data = (await response.json()) as Opportunity[];

    expect(response.status).toBe(200);
    expect(data.map((row) => row.id)).toEqual(["fresh", "stale"]);
  });

  it("falls back to legacy discovery ordering when stale columns are unavailable", async () => {
    isSchemaCompatErrorMock.mockReturnValue(true);
    const opportunityRows = [
      makeOpportunity({ id: "legacy-a", match_score: 88, discovery_is_stale: undefined }),
      makeOpportunity({ id: "legacy-b", match_score: 77, discovery_is_stale: undefined }),
    ];

    const createCompatChain = (apply: (filters: FilterState, orders: string[]) => { data: Opportunity[] | null; error: unknown }) => {
      const filters = createFilterState();
      const orders: string[] = [];
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
          orders.push(column);
          return chain;
        },
        then<TResult1 = { data: Opportunity[] | null; error: unknown }, TResult2 = never>(
          onfulfilled?: ((value: { data: Opportunity[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
          onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
        ): Promise<TResult1 | TResult2> {
          try {
            const result = apply(filters, orders);
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

    const supabase = {
      from: (table: string) => {
        if (table === "opportunities") {
          return {
            select: () =>
              createCompatChain((filters, orders) => {
                if (orders.includes("discovery_is_stale")) {
                  return {
                    data: null,
                    error: { message: "column opportunities.discovery_is_stale does not exist", code: "42703" },
                  };
                }
                return {
                  data: applyFilters(opportunityRows, filters),
                  error: null,
                };
              }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    };

    withAuthMock.mockResolvedValue({
      supabase,
      user: { id: "user-1" },
    });

    const response = await GET(
      new Request("http://localhost/api/opportunities?discovery_scope=active_discovered")
    );
    const data = (await response.json()) as Opportunity[];

    expect(response.status).toBe(200);
    expect(data.map((row) => row.id)).toEqual(["legacy-a", "legacy-b"]);
    expect(data.every((row) => row.discovery_is_stale === false)).toBe(true);
  });
});
