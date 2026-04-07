import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDiscoveryProfileContext } from "@/lib/server/resume-keywords";
import { runDiscoveryForUser, type DiscoveryPreferencesRow } from "@/lib/services/discovery/run-discovery";
import { fetchAllDiscoveryJobs, type NormalizedJob } from "@/lib/services/job-apis";

vi.mock("@/lib/server/resume-keywords", () => ({
  getDiscoveryProfileContext: vi.fn(),
}));

vi.mock("@/lib/services/job-apis", () => ({
  fetchAllDiscoveryJobs: vi.fn(),
}));

const fetchAllDiscoveryJobsMock = vi.mocked(fetchAllDiscoveryJobs);
const getDiscoveryProfileContextMock = vi.mocked(getDiscoveryProfileContext);

const createSupabaseStub = (prefRow: DiscoveryPreferencesRow) => {
  const insertedOpportunities: Array<Record<string, unknown>> = [];
  const insertedRunPayloads: Array<Record<string, unknown>> = [];
  const discoveryRunUpdates: Array<Record<string, unknown>> = [];
  const preferenceUpdates: Array<Record<string, unknown>> = [];

  const supabase = {
    from: (table: string) => {
      if (table === "discovery_runs") {
        return {
          select: (_columns: string, options?: { count?: string; head?: boolean }) => {
            if (options?.head) {
              return {
                eq: () => ({
                  gte: async () => ({ count: 0, error: null }),
                }),
              };
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
          insert: async (payload: Record<string, unknown>) => {
            insertedOpportunities.push(payload);
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;

  return {
    supabase,
    insertedOpportunities,
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
  api_source: "remotive",
  api_job_id: "remotive-1",
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

describe("runDiscoveryForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps fetched jobs when resume context is missing", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue({ jobs: [backendInternJob], sourceErrors: {} });
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "",
      profileKeywords: [],
      profileContextText: "",
      profileLocation: "",
    });

    const { supabase, insertedOpportunities, discoveryRunUpdates, preferenceUpdates } =
      createSupabaseStub(defaultPreferences);

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      runId: "run-1",
      resultsCount: 1,
      newOpportunitiesCount: 1,
      sourceErrors: {},
    });
    expect(insertedOpportunities).toHaveLength(1);
    expect(insertedOpportunities[0]).toMatchObject({
      company: "Acme",
      role: "Backend Python Intern",
      api_source: "remotive",
      api_job_id: "remotive-1",
      discovery_run_id: "run-1",
    });
    expect(insertedOpportunities[0]?.match_score).toBeGreaterThan(30);
    expect(discoveryRunUpdates).toHaveLength(1);
    expect(preferenceUpdates).toHaveLength(1);
  });

  it("merges detected resume context with saved filters for discovery search input", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue({ jobs: [backendInternJob], sourceErrors: {} });
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
      resume_context_enabled: true,
      detected_context: {
        locations: ["Toronto"],
        role_types: ["intern", "entry-level", "junior"],
      },
      effective_context: expect.objectContaining({
        locations: ["Toronto"],
        role_types: ["intern", "entry-level", "junior"],
      }),
    });
  });

  it("keeps intern roles and filters senior roles at the saved threshold", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue({
      jobs: [seniorDevOpsJob, backendInternJob],
      sourceErrors: {},
    });
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Built Python FastAPI Redis Docker backend systems for LLM workflows.",
      profileKeywords: ["python", "fastapi", "redis", "docker", "backend"],
      profileContextText: "Backend engineer focused on Python FastAPI Redis Docker systems.",
      profileLocation: "Toronto",
    });

    const { supabase, insertedOpportunities } = createSupabaseStub(defaultPreferences);

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      runId: "run-1",
      resultsCount: 2,
      newOpportunitiesCount: 1,
      sourceErrors: {},
    });
    expect(insertedOpportunities).toHaveLength(1);
    expect(insertedOpportunities[0]?.role).toBe("Backend Python Intern");
    expect(insertedOpportunities[0]?.match_score).toBeGreaterThanOrEqual(55);
  });

  it("still respects a stricter custom minimum score when resume context exists", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue({
      jobs: [
        {
          ...backendInternJob,
          title: "Software Engineer",
          api_job_id: "remotive-3",
          description: "Build Python APIs and backend services.",
        },
      ],
      sourceErrors: {},
    });
    getDiscoveryProfileContextMock.mockResolvedValue({
      resumeText: "Built Python FastAPI Redis Docker backend systems for LLM workflows.",
      profileKeywords: ["python", "backend"],
      profileContextText: "Backend engineer focused on Python APIs.",
      profileLocation: "Toronto",
    });

    const { supabase, insertedOpportunities } = createSupabaseStub({
      ...defaultPreferences,
      min_match_score: 70,
    });

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      runId: "run-1",
      resultsCount: 1,
      newOpportunitiesCount: 0,
      sourceErrors: {},
    });
    expect(insertedOpportunities).toHaveLength(0);
  });

  it("uses the saved context location override as the search location", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue({ jobs: [backendInternJob], sourceErrors: {} });
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
});
