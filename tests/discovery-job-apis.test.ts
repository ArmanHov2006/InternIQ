import { afterEach, describe, expect, it, vi } from "vitest";
import { buildWhatExclude, fetchAdzunaJobs } from "@/lib/services/job-apis/adzuna";
import { filterJobsByRoleTypeSeniority, type NormalizedJob } from "@/lib/services/job-apis";
import { fetchRemotiveJobs } from "@/lib/services/job-apis/remotive";

describe("discovery job api filters", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.ADZUNA_APP_ID;
    delete process.env.ADZUNA_APP_KEY;
  });

  it("skips senior remotive roles for entry-level searches", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          {
            id: 1,
            title: "Senior DevOps Engineer",
            company_name: "InfraCo",
            candidate_required_location: "Remote",
            description: "Python and Docker infrastructure.",
            salary: "",
            url: "https://example.com/senior",
            publication_date: "2026-04-06T00:00:00.000Z",
            category: "Software Development",
            tags: "python docker",
          },
          {
            id: 2,
            title: "Software Engineering Intern",
            company_name: "Acme",
            candidate_required_location: "Remote",
            description: "Build Python backend systems.",
            salary: "",
            url: "https://example.com/intern",
            publication_date: "2026-04-06T00:00:00.000Z",
            category: "Software Development",
            tags: "python backend",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const jobs = await fetchRemotiveJobs({
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
      "senior sr staff principal lead director vp chief architect"
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "what_exclude=senior%20sr%20staff%20principal%20lead%20director%20vp%20chief%20architect"
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
        api_source: "remotive",
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
