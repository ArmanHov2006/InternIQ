import { afterEach, describe, expect, it, vi } from "vitest";
import { buildWhatExclude, fetchAdzunaJobs } from "@/lib/services/job-apis/adzuna";
import {
  buildLocationAwareQuerySpecs,
  fetchAllDiscoveryJobs,
  filterDiscoveryJobs,
  filterJobsByRoleTypeSeniority,
  type NormalizedJob,
} from "@/lib/services/job-apis";
import { fetchJobicyJobs } from "@/lib/services/job-apis/jobicy";

describe("discovery job api filters", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.ADZUNA_APP_ID;
    delete process.env.ADZUNA_APP_KEY;
  });

  it("skips senior jobicy roles for entry-level searches", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          {
            id: 1,
            jobTitle: "Senior DevOps Engineer",
            companyName: "InfraCo",
            jobGeo: "Remote",
            jobExcerpt: "Python and Docker infrastructure.",
            url: "https://example.com/senior",
            pubDate: "2026-04-06T00:00:00.000Z",
            jobLevel: "Senior",
          },
          {
            id: 2,
            jobTitle: "Software Engineering Intern",
            companyName: "Acme",
            jobGeo: "Remote",
            jobExcerpt: "Build Python backend systems.",
            url: "https://example.com/intern",
            pubDate: "2026-04-06T00:00:00.000Z",
            jobLevel: "Entry-Level",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const jobs = await fetchJobicyJobs({
      keywords: ["python"],
      roleTypes: ["intern", "junior"],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.title).toBe("Software Engineering Intern");
  });

  it("adds the seniority exclusion list to adzuna entry-level searches", async () => {
    process.env.ADZUNA_APP_ID = "app-id";
    process.env.ADZUNA_APP_KEY = "app-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchAdzunaJobs({
      keywords: ["Python"],
      locations: ["Toronto"],
      roleTypes: ["intern"],
      maxPages: 1,
    });

    expect(buildWhatExclude(["intern"])).toBe(
      "senior sr staff principal lead director vp chief architect manager head"
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "what_exclude=senior%20sr%20staff%20principal%20lead%20director%20vp%20chief%20architect%20manager%20head"
    );
  });

  it("drops seniority mismatches in the aggregate filter before dedupe", () => {
    const jobs: NormalizedJob[] = [
      {
        title: "Tech Lead Full-Stack Rails Engineer",
        company: "LeadCo",
        location: "Remote",
        description: "",
        salary: "",
        job_url: "https://example.com/lead",
        api_source: "greenhouse",
        api_job_id: "g-1",
        is_remote: true,
        posted_at: null,
      },
      {
        title: "Principal Engineer",
        company: "PrincipalCo",
        location: "Remote",
        description: "",
        salary: "",
        job_url: "https://example.com/principal",
        api_source: "themuse",
        api_job_id: "m-1",
        is_remote: true,
        posted_at: null,
      },
      {
        title: "Software Engineer",
        company: "NeutralCo",
        location: "Remote",
        description: "",
        salary: "",
        job_url: "https://example.com/neutral",
        api_source: "greenhouse",
        api_job_id: "g-2",
        is_remote: true,
        posted_at: null,
      },
      {
        title: "Software Engineering Intern",
        company: "InternCo",
        location: "Remote",
        description: "",
        salary: "",
        job_url: "https://example.com/intern",
        api_source: "jobicy",
        api_job_id: "r-1",
        is_remote: true,
        posted_at: null,
      },
    ];

    const filtered = filterJobsByRoleTypeSeniority(jobs, ["intern", "junior"]);

    expect(filtered.map((job) => job.title)).toEqual([
      "Software Engineer",
      "Software Engineering Intern",
    ]);
  });

  it("keeps fully remote jobs when a city is selected and remote is still allowed", () => {
    const jobs: NormalizedJob[] = [
      {
        title: "Backend Engineer",
        company: "RemoteCo",
        location: "Remote",
        description: "Build Python APIs.",
        salary: "",
        job_url: "https://example.com/remote",
        api_source: "jobicy",
        api_job_id: "remote-1",
        is_remote: true,
        posted_at: null,
      },
    ];

    const filtered = filterDiscoveryJobs(jobs, {
      keywords: ["python"],
      locations: ["Toronto"],
      remotePreference: "any",
      roleTypes: ["intern", "junior"],
      excludedCompanies: [],
      greenhouseSlugs: [],
    });

    expect(filtered.jobs).toHaveLength(1);
    expect(filtered.stageCounts).toMatchObject({
      fetched: 1,
      afterRemote: 1,
      afterLocation: 1,
      afterSeniority: 1,
    });
  });

  it("builds both local and remote-friendly source queries when a city is selected", async () => {
    process.env.ADZUNA_APP_ID = "app-id";
    process.env.ADZUNA_APP_KEY = "app-key";

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("api.adzuna.com")) {
        return { ok: true, json: async () => ({ results: [] }) };
      }
      if (url.includes("jobicy.com")) {
        return { ok: true, json: async () => ({ jobs: [] }) };
      }
      if (url.includes("remoteok.com")) {
        return { ok: true, json: async () => [] };
      }
      if (url.includes("himalayas.app")) {
        return { ok: true, json: async () => ({ jobs: [] }) };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const specs = buildLocationAwareQuerySpecs({
      locations: ["Toronto"],
      remotePreference: "any",
    });
    const result = await fetchAllDiscoveryJobs({
      keywords: ["python"],
      locations: ["Toronto"],
      remotePreference: "any",
      roleTypes: ["intern", "junior"],
      excludedCompanies: [],
      greenhouseSlugs: [],
      adzunaMaxPages: 1,
      sourceTimeoutMs: 250,
    });

    const adzunaCalls = fetchMock.mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.includes("api.adzuna.com"));

    expect(specs).toEqual([
      { locations: ["Toronto"], remoteQuery: false },
      { locations: ["Toronto"], remoteQuery: true },
    ]);
    expect(result.sourceQueryLocations).toEqual(["Toronto", "Remote"]);
    expect(adzunaCalls).toHaveLength(2);
    expect(adzunaCalls.some((url) => url.includes("where=Toronto"))).toBe(true);
    expect(
      adzunaCalls.some((url) => !url.includes("where=") && decodeURIComponent(url).includes("remote"))
    ).toBe(true);
  });

  it("still excludes fully remote jobs when onsite is required", () => {
    const jobs: NormalizedJob[] = [
      {
        title: "Backend Engineer",
        company: "RemoteCo",
        location: "Remote",
        description: "Build Python APIs.",
        salary: "",
        job_url: "https://example.com/remote",
        api_source: "jobicy",
        api_job_id: "remote-1",
        is_remote: true,
        posted_at: null,
      },
    ];

    const filtered = filterDiscoveryJobs(jobs, {
      keywords: ["python"],
      locations: ["Toronto"],
      remotePreference: "onsite",
      roleTypes: ["intern", "junior"],
      excludedCompanies: [],
      greenhouseSlugs: [],
    });

    expect(filtered.jobs).toHaveLength(0);
    expect(filtered.stageCounts).toMatchObject({
      fetched: 1,
      afterRemote: 0,
      afterLocation: 0,
      afterSeniority: 0,
    });
  });

  it("times out a slow source without blocking the full discovery run", async () => {
    process.env.ADZUNA_APP_ID = "app-id";
    process.env.ADZUNA_APP_KEY = "app-key";

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("himalayas.app")) {
        return new Promise((_, reject) => {
          const signal = init?.signal as AbortSignal | undefined;
          signal?.addEventListener(
            "abort",
            () => reject(new DOMException("The operation was aborted.", "AbortError")),
            { once: true }
          );
        });
      }
      if (url.includes("api.adzuna.com")) {
        return Promise.resolve({ ok: true, json: async () => ({ results: [] }) });
      }
      if (url.includes("jobicy.com")) {
        return Promise.resolve({ ok: true, json: async () => ({ jobs: [] }) });
      }
      if (url.includes("remoteok.com")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAllDiscoveryJobs({
      keywords: ["python"],
      locations: ["Toronto"],
      remotePreference: "any",
      roleTypes: ["intern", "junior"],
      excludedCompanies: [],
      greenhouseSlugs: [],
      adzunaMaxPages: 1,
      sourceTimeoutMs: 25,
    });

    expect(result.sourceErrors.himalayas).toContain("timed out");
    expect(result.sourceStats.himalayas).toMatchObject({
      timedOut: true,
      count: 0,
    });
    expect(result.sourceStats.remoteok?.timedOut).toBe(false);
  });
});
