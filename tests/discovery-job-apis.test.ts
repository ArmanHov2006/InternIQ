import { afterEach, describe, expect, it, vi } from "vitest";
import { buildWhatExclude, fetchAdzunaJobs } from "@/lib/services/job-apis/adzuna";
import { filterJobsByRoleTypeSeniority, type NormalizedJob } from "@/lib/services/job-apis";
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
});
