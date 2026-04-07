import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getResumeAndKeywords } from "@/lib/server/resume-keywords";
import { runDiscoveryForUser, type DiscoveryPreferencesRow } from "@/lib/services/discovery/run-discovery";
import { fetchAllDiscoveryJobs, type NormalizedJob } from "@/lib/services/job-apis";

vi.mock("@/lib/server/resume-keywords", () => ({
  getResumeAndKeywords: vi.fn(),
}));

vi.mock("@/lib/services/job-apis", () => ({
  fetchAllDiscoveryJobs: vi.fn(),
}));

const fetchAllDiscoveryJobsMock = vi.mocked(fetchAllDiscoveryJobs);
const getResumeAndKeywordsMock = vi.mocked(getResumeAndKeywords);

const createSupabaseStub = (prefRow: DiscoveryPreferencesRow) => {
  const insertedOpportunities: Array<Record<string, unknown>> = [];
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
          insert: (_payload: Record<string, unknown>) => ({
            select: () => ({
              single: async () => ({ data: { id: "run-1" }, error: null }),
            }),
          }),
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

  return { supabase, insertedOpportunities, discoveryRunUpdates, preferenceUpdates };
};

const defaultPreferences: DiscoveryPreferencesRow = {
  keywords: ["Python"],
  locations: ["Toronto"],
  remote_preference: "any",
  role_types: ["junior"],
  excluded_companies: [],
  greenhouse_slugs: [],
  min_match_score: 50,
  is_active: true,
};

const pythonJob: NormalizedJob = {
  title: "Junior Python Developer",
  company: "Acme",
  location: "Toronto",
  description: "Build Python automation and backend APIs for internal tools.",
  salary: "",
  job_url: "https://example.com/jobs/1",
  api_source: "remotive",
  api_job_id: "remotive-1",
  is_remote: true,
  posted_at: "2026-04-06T14:30:00.000Z",
};

describe("runDiscoveryForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps fetched jobs when resume context is missing", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue({ jobs: [pythonJob], sourceErrors: {} });
    getResumeAndKeywordsMock.mockResolvedValue({ resumeText: "", profileKeywords: [] });

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
      role: "Junior Python Developer",
      api_source: "remotive",
      api_job_id: "remotive-1",
      discovery_run_id: "run-1",
    });
    expect(insertedOpportunities[0]?.match_score).toBeGreaterThan(28);
    expect(discoveryRunUpdates).toHaveLength(1);
    expect(preferenceUpdates).toHaveLength(1);
  });

  it("still respects the minimum score when resume context exists", async () => {
    fetchAllDiscoveryJobsMock.mockResolvedValue({ jobs: [pythonJob], sourceErrors: {} });
    getResumeAndKeywordsMock.mockResolvedValue({
      resumeText: "Recruiting coordinator with campus hiring experience.",
      profileKeywords: ["recruiting"],
    });

    const { supabase, insertedOpportunities } = createSupabaseStub(defaultPreferences);

    const result = await runDiscoveryForUser(supabase, "user-1");

    expect(result).toMatchObject({
      runId: "run-1",
      resultsCount: 1,
      newOpportunitiesCount: 0,
      sourceErrors: {},
    });
    expect(insertedOpportunities).toHaveLength(0);
  });
});
