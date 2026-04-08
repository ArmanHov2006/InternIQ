import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDiscoveryProfileContext } from "@/lib/server/resume-keywords";
import {
  runDiscoveryForUser,
  type DiscoveryPreferencesRow,
} from "@/lib/services/discovery/run-discovery";
import {
  fetchAllDiscoveryJobs,
  type DiscoveryFetchResult,
  type NormalizedJob,
} from "@/lib/services/job-apis";
import type { Opportunity } from "@/types/database";

vi.mock("@/lib/server/resume-keywords", () => ({
  getDiscoveryProfileContext: vi.fn(),
}));

vi.mock("@/lib/services/job-apis", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/services/job-apis")>();
  return {
    ...actual,
    fetchAllDiscoveryJobs: vi.fn(),
  };
});

const fetchAllDiscoveryJobsMock = vi.mocked(fetchAllDiscoveryJobs);
const getDiscoveryProfileContextMock = vi.mocked(getDiscoveryProfileContext);

type OpportunityFilters = {
  eq: Array<[string, unknown]>;
  is: Array<[string, unknown]>;
  notNull: string[];
  gte: Array<[string, unknown]>;
};

const createEmptyFilters = (): OpportunityFilters => ({
  eq: [],
  is: [],
  notNull: [],
  gte: [],
});

const applyOpportunityFilters = (
  rows: Opportunity[],
  filters: OpportunityFilters
): Opportunity[] => {
  return rows.filter((row) => {
    if (
      filters.eq.some(([key, value]) => {
        return (row as unknown as Record<string, unknown>)[key] !== value;
      })
    ) {
      return false;
    }
    if (
      filters.is.some(([key, value]) => {
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
};

const createPromiseChain = <T>(apply: (filters: OpportunityFilters) => T) => {
  const filters = createEmptyFilters();
  const chain = {
    eq(key: string, value: unknown) {
      filters.eq.push([key, value]);
      return chain;
    },
    is(key: string, value: unknown) {
      filters.is.push([key, value]);
      return chain;
    },
    not(key: string, operator: string, value: unknown) {
      if (operator === "is" && value === null) {
        filters.notNull.push(key);
      }
      return chain;
    },
    gte(key: string, value: unknown) {
      filters.gte.push([key, value]);
      return chain;
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

const createSupabaseStub = (
  prefRow: DiscoveryPreferencesRow,
  initialOpportunities: Opportunity[] = []
) => {
  const opportunities = initialOpportunities.map((row) => ({ ...row }));
  const insertedRunPayloads: Array<Record<string, unknown>> = [];
  const discoveryRunUpdates: Array<Record<string, unknown>> = [];
  const preferenceUpdates: Array<Record<string, unknown>> = [];

  const supabase = {
    from: (table: string) => {
      if (table === "discovery_runs") {
        return {
          select: (_columns: string, options?: { count?: string; head?: boolean }) => {
            if (options?.head) {
              return createPromiseChain(() => ({ count: 0, error: null }));
            }
            throw new Error("Unexpected discovery_runs select");
          },
          insert: (payload: Record<string, unknown>) => {
            insertedRunPayloads.push(payload);
            return {
              select: () => ({
                single: async () => ({ data: { id: "run-1" }, error: null }),
              }),
            };
          },
          update: (payload: Record<string, unknown>) => ({
            eq: async () => {
              discoveryRunUpdates.push(payload);
              return { error: null };
            },
          }),
        };
      }

      if (table === "discovery_preferences") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: prefRow, error: null }),
            }),
          }),
          update: (payload: Record<string, unknown>) => ({
            eq: async () => {
              preferenceUpdates.push(payload);
              return { error: null };
            },
          }),
        };
      }

      if (table === "opportunities") {
        return {
          select: () =>
            createPromiseChain((filters) => ({
              data: applyOpportunityFilters(opportunities, filters),
              error: null,
            })),
          update: (payload: Record<string, unknown>) =>
            createPromiseChain((filters) => {
              const matches = applyOpportunityFilters(opportunities, filters);
              for (const row of matches) {
                Object.assign(row, payload);
              }
              return { error: null };
            }),
          insert: async (payload: Record<string, unknown>) => {
            opportunities.push(payload as unknown as Opportunity);
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;

  return {
    supabase,
    opportunities,
    insertedRunPayloads,
    discoveryRunUpdates,
    preferenceUpdates,
  };
};

const defaultPreferences: DiscoveryPreferencesRow = {
  keywords: ["platform"],
  locations: [],
  remote_preference: "any",
  role_types: ["intern", "entry-level", "junior"],
  excluded_companies: [],
  greenhouse_slugs: [],
  min_match_score: 55,
  resume_context_enabled: true,
  resume_context_customized: false,
  resume_context_overrides: {
    skills: [],
    locations: [],
    role_types: [],
    note: "",
  },
  is_active: true,
};

const backendInternJob: NormalizedJob = {
  title: "Backend Python Intern",
  company: "Acme",
  location: "Toronto",
  description: "Build Python, FastAPI, Redis, and Docker services for backend systems.",
  salary: "",
  job_url: "https://example.com/jobs/1",
  api_source: "jobicy",
  api_job_id: "jobicy-1",
  is_remote: true,
  posted_at: "2026-04-06T14:30:00.000Z",
};

const seniorDevOpsJob: NormalizedJob = {
  title: "Senior DevOps Engineer",
  company: "InfraCo",
  location: "Remote",
  description: "Own Python automation, Docker infrastructure, and cloud reliability.",
  salary: "",
  job_url: "https://example.com/jobs/2",
  api_source: "greenhouse",
  api_job_id: "greenhouse-2",
  is_remote: true,
  posted_at: "2026-04-06T14:30:00.000Z",
};

const buildFetchResult = (
  jobs: NormalizedJob[],
  overrides: Partial<DiscoveryFetchResult> = {}
): DiscoveryFetchResult => ({
  jobs,
  sourceErrors: overrides.sourceErrors ?? {},
  sourceStats: overrides.sourceStats ?? {},
  sourceQueryLocations: overrides.sourceQueryLocations ?? [],
  stageCounts: {
    fetched: jobs.length,
    afterRemote: jobs.length,
    afterLocation: jobs.length,
    afterSeniority: jobs.length,
    ...(overrides.stageCounts ?? {}),
  },
});

const existingOpportunity = (overrides: Partial<Opportunity>): Opportunity => ({
  id: overrides.id ?? crypto.randomUUID(),
  user_id: "user-1",
  company: overrides.company ?? "Acme",
  role: overrides.role ?? "Backend Python Intern",
  location: overrides.location ?? "Toronto",
  board: overrides.board ?? "jobicy",
  source: "recommendation",
  job_url: overrides.job_url ?? "https://example.com/jobs/1",
  external_job_id: overrides.external_job_id ?? overrides.api_job_id ?? "jobicy-1",
  salary_range: overrides.salary_range ?? "",
  status: overrides.status ?? "new",
  employment_type: overrides.employment_type ?? "Remote",
  job_description: overrides.job_description ?? backendInternJob.description,
  match_score: overrides.match_score ?? 70,
  match_summary: overrides.match_summary ?? "Fast match found overlap on python, fastapi.",
  matched_keywords: overrides.matched_keywords ?? ["python", "fastapi"],
  missing_keywords: overrides.missing_keywords ?? ["docker"],
  application_id: overrides.application_id ?? null,
  created_at: overrides.created_at ?? "2026-04-05T10:00:00.000Z",
  updated_at: overrides.updated_at ?? "2026-04-05T10:00:00.000Z",
  api_source: overrides.api_source ?? "jobicy",
  api_job_id: overrides.api_job_id ?? "jobicy-1",
  discovery_run_id: overrides.discovery_run_id ?? "run-old",
  ai_score: overrides.ai_score ?? { final_score: 88 },
  posted_at: overrides.posted_at ?? "2026-04-05T10:00:00.000Z",
});

describe("runDiscoveryForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps fetched jobs when resume context is missing", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue(buildFetchResult([backendInternJob]));
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "",
      profileKeywords: [],
      profileContextText: "",
      profileLocation: "",
    });

    const noResumePreferences: DiscoveryPreferencesRow = {
      ...defaultPreferences,
      keywords: ["python", "backend"],
      min_match_score: 25,
    };
    const { supabase, opportunities, discoveryRunUpdates, preferenceUpdates } =
      createSupabaseStub(noResumePreferences);

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      runId: "run-1",
      reviewedCount: 1,
      activeCount: 1,
      archivedCount: 0,
      updatedCount: 0,
      reactivatedCount: 0,
      newOpportunitiesCount: 1,
      sourceErrors: {},
      diagnostics: {
        reasonCode: "success",
        stageCounts: {
          fetched: 1,
          afterRemote: 1,
          afterLocation: 1,
          afterSeniority: 1,
          afterThreshold: 1,
          active: 1,
          inserted: 1,
          updated: 0,
          reactivated: 0,
        },
      },
    });
    expect(opportunities).toHaveLength(1);
    expect(opportunities[0]).toMatchObject({
      company: "Acme",
      role: "Backend Python Intern",
      api_source: "jobicy",
      api_job_id: "jobicy-1",
      discovery_run_id: "run-1",
      ai_score: {},
    });
    expect(opportunities[0]?.match_score).toBeGreaterThanOrEqual(25);
    expect(discoveryRunUpdates).toHaveLength(1);
    expect(preferenceUpdates).toHaveLength(1);
  });

  it("merges detected resume context with saved filters for discovery search input", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue(buildFetchResult([backendInternJob]));
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Python FastAPI Redis Docker backend systems.",
      profileKeywords: ["Python", "FastAPI"],
      profileContextText: "Software Intern at Acme. Security-focused LLM gateway. Location: Toronto",
      profileLocation: "Toronto",
    });

    const { supabase, insertedRunPayloads } = createSupabaseStub(defaultPreferences);

    await runDiscoveryForUser(supabase, "user-1");

    expect(fetchAllDiscoveryJobsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: expect.arrayContaining(["Python", "FastAPI", "Redis", "Docker", "platform"]),
        locations: ["Toronto"],
        roleTypes: ["intern", "entry-level", "junior"],
      })
    );
    expect(insertedRunPayloads[0]?.query_params).toMatchObject({
      keywords: expect.arrayContaining(["Python", "FastAPI", "Redis", "Docker", "platform"]),
      locations: ["Toronto"],
      source_query_locations: ["Toronto", "Remote"],
      role_types: ["intern", "entry-level", "junior"],
      resume_context_enabled: true,
      detected_context: {
        locations: ["Toronto"],
        role_types: ["intern", "entry-level", "junior"],
      },
      effective_context: expect.objectContaining({
        locations: ["Toronto"],
        role_types: ["intern", "entry-level", "junior"],
      }),
      executed_context: expect.objectContaining({
        locations: ["Toronto"],
        source_query_locations: ["Toronto", "Remote"],
        role_types: ["intern", "entry-level", "junior"],
        remote_preference: "any",
      }),
    });
  });

  it("keeps intern roles and filters senior roles at the saved threshold", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue(
      buildFetchResult([seniorDevOpsJob, backendInternJob])
    );
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Built Python FastAPI Redis Docker backend systems for LLM workflows.",
      profileKeywords: ["python", "fastapi", "redis", "docker", "backend"],
      profileContextText: "Backend engineer focused on Python FastAPI Redis Docker systems.",
      profileLocation: "Toronto",
    });

    const { supabase, opportunities } = createSupabaseStub(defaultPreferences);

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      reviewedCount: 2,
      activeCount: 1,
      newOpportunitiesCount: 1,
      sourceErrors: {},
    });
    expect(opportunities).toHaveLength(1);
    expect(opportunities[0]?.role).toBe("Backend Python Intern");
    expect(opportunities[0]?.match_score).toBeGreaterThanOrEqual(55);
  });

  it("respects a stricter minimum score even when a matching role is returned", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue(
      buildFetchResult([
        {
          ...backendInternJob,
          title: "Software Engineer",
          api_job_id: "jobicy-3",
          description: "Build Python APIs and backend services.",
        },
      ], {
        sourceErrors: {
          himalayas: "Himalayas HTTP 522",
        },
      })
    );
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Built Python FastAPI Redis Docker backend systems for LLM workflows.",
      profileKeywords: ["python", "backend"],
      profileContextText: "Backend engineer focused on Python APIs.",
      profileLocation: "Toronto",
    });

    const { supabase, opportunities } = createSupabaseStub({
      ...defaultPreferences,
      min_match_score: 85,
    });

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      reviewedCount: 1,
      activeCount: 0,
      newOpportunitiesCount: 0,
      sourceErrors: {},
      diagnostics: {
        reasonCode: "score_threshold_filtered_out",
        secondaryIssues: ["source_errors"],
        stageCounts: {
          fetched: 1,
          afterRemote: 1,
          afterLocation: 1,
          afterSeniority: 1,
          afterThreshold: 0,
          active: 0,
          inserted: 0,
          updated: 0,
          reactivated: 0,
        },
      },
    });
    expect(opportunities).toHaveLength(0);
  });

  it("uses the saved context location override as the search location", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue(buildFetchResult([backendInternJob]));
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Built Python FastAPI Redis Docker backend systems for LLM workflows.",
      profileKeywords: ["python", "backend"],
      profileContextText: "Backend engineer focused on Python APIs.",
      profileLocation: "",
    });

    const customPreferences: DiscoveryPreferencesRow = {
      ...defaultPreferences,
      role_types: [],
      resume_context_customized: true,
      resume_context_overrides: {
        skills: ["Python", "FastAPI", "Redis"],
        locations: ["Toronto"],
        role_types: ["intern"],
        note: "",
      },
    };

    const { supabase } = createSupabaseStub(customPreferences);

    await runDiscoveryForUser(supabase, "user-1");

    expect(fetchAllDiscoveryJobsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        locations: ["Toronto"],
        roleTypes: ["intern"],
      })
    );
  });

  it("archives prior unsaved matches and preserves saved jobs across reruns", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue(
      buildFetchResult([
        {
          ...backendInternJob,
          api_job_id: "jobicy-saved",
          job_url: "https://example.com/jobs/saved",
        },
      ])
    );
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Built Python FastAPI Redis Docker backend systems for LLM workflows.",
      profileKeywords: ["python", "fastapi", "redis", "docker", "backend"],
      profileContextText: "Backend engineer focused on Python FastAPI Redis Docker systems.",
      profileLocation: "Toronto",
    });

    const staleNew = existingOpportunity({
      id: "opp-old",
      api_job_id: "jobicy-old",
      external_job_id: "jobicy-old",
      job_url: "https://example.com/jobs/old",
      status: "new",
      application_id: null,
    });
    const saved = existingOpportunity({
      id: "opp-saved",
      api_job_id: "jobicy-saved",
      external_job_id: "jobicy-saved",
      job_url: "https://example.com/jobs/saved",
      status: "saved",
      application_id: "app-1",
      ai_score: { final_score: 95 },
    });

    const { supabase, opportunities } = createSupabaseStub(defaultPreferences, [staleNew, saved]);

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      archivedCount: 1,
      activeCount: 0,
      newOpportunitiesCount: 0,
      updatedCount: 1,
      reactivatedCount: 0,
      diagnostics: {
        reasonCode: "all_refreshed",
        stageCounts: {
          fetched: 1,
          afterRemote: 1,
          afterLocation: 1,
          afterSeniority: 1,
          afterThreshold: 1,
          active: 0,
          inserted: 0,
          updated: 1,
          reactivated: 0,
        },
      },
    });
    expect(opportunities.find((row) => row.id === "opp-old")?.status).toBe("archived");
    expect(opportunities.find((row) => row.id === "opp-saved")).toMatchObject({
      status: "saved",
      application_id: "app-1",
      discovery_run_id: "run-1",
      ai_score: {},
    });
  });

  it("reactivates archived duplicates instead of inserting a second row", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue(buildFetchResult([backendInternJob]));
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Built Python FastAPI Redis Docker backend systems for LLM workflows.",
      profileKeywords: ["python", "fastapi", "redis", "docker", "backend"],
      profileContextText: "Backend engineer focused on Python FastAPI Redis Docker systems.",
      profileLocation: "Toronto",
    });

    const archived = existingOpportunity({
      id: "opp-archived",
      status: "archived",
      ai_score: { final_score: 91 },
    });

    const { supabase, opportunities } = createSupabaseStub(defaultPreferences, [archived]);

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      activeCount: 1,
      newOpportunitiesCount: 0,
      updatedCount: 1,
      reactivatedCount: 1,
    });
    expect(opportunities).toHaveLength(1);
    expect(opportunities[0]).toMatchObject({
      id: "opp-archived",
      status: "new",
      discovery_run_id: "run-1",
      ai_score: {},
    });
  });

  it("reports when location filtering removes every job before shortlist scoring", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue(
      buildFetchResult([], {
        stageCounts: {
          fetched: 18,
          afterRemote: 14,
          afterLocation: 0,
          afterSeniority: 0,
        },
      })
    );
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Built Python FastAPI Redis Docker backend systems for LLM workflows.",
      profileKeywords: ["python", "fastapi", "redis", "docker", "backend"],
      profileContextText: "Backend engineer focused on Python FastAPI Redis Docker systems.",
      profileLocation: "Toronto",
    });

    const { supabase } = createSupabaseStub(defaultPreferences);

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      reviewedCount: 0,
      activeCount: 0,
      newOpportunitiesCount: 0,
      diagnostics: {
        reasonCode: "location_filtered_out",
        executedContext: {
          locations: ["Toronto"],
          source_query_locations: ["Toronto", "Remote"],
          role_types: ["intern", "entry-level", "junior"],
          remote_preference: "any",
        },
        effectiveContext: {
          locations: ["Toronto"],
          remote_preference: "any",
          role_types: ["intern", "entry-level", "junior"],
        },
        stageCounts: {
          fetched: 18,
          afterRemote: 14,
          afterLocation: 0,
          afterSeniority: 0,
          afterThreshold: 0,
          active: 0,
          inserted: 0,
          updated: 0,
          reactivated: 0,
        },
      },
    });
  });

  it("reports when no source jobs are returned at all", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue(
      buildFetchResult([], {
        stageCounts: {
          fetched: 0,
          afterRemote: 0,
          afterLocation: 0,
          afterSeniority: 0,
        },
      })
    );
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Built Python FastAPI Redis Docker backend systems for LLM workflows.",
      profileKeywords: ["python", "fastapi", "redis", "docker", "backend"],
      profileContextText: "Backend engineer focused on Python FastAPI Redis Docker systems.",
      profileLocation: "Toronto",
    });

    const { supabase } = createSupabaseStub(defaultPreferences);

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result.diagnostics).toMatchObject({
      reasonCode: "no_source_results",
      stageCounts: {
        fetched: 0,
        afterRemote: 0,
        afterLocation: 0,
        afterSeniority: 0,
        afterThreshold: 0,
        active: 0,
        inserted: 0,
        updated: 0,
        reactivated: 0,
      },
    });
  });
});
