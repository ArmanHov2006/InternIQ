import type { NormalizedJob } from "./types";
import { hasEntryLevelRoleTypes } from "@/lib/services/career-os";

const JOBICY_BASE = "https://jobicy.com/api/v2/remote-jobs";

const SENIOR_RE = /\b(senior|sr\.?|staff|lead|principal|director|vp|chief|head|architect|manager)\b/i;

export const fetchJobicyJobs = async (input: {
  keywords: string[];
  roleTypes: string[];
}): Promise<NormalizedJob[]> => {
  const params = new URLSearchParams({ count: "20" });
  if (input.keywords.length > 0) {
    params.set("tag", input.keywords.slice(0, 3).join(","));
  }

  const url = `${JOBICY_BASE}?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Jobicy HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    jobs?: Array<{
      id?: number;
      jobTitle?: string;
      companyName?: string;
      jobGeo?: string;
      jobExcerpt?: string;
      url?: string;
      pubDate?: string;
      jobLevel?: string;
      jobType?: string;
      annualSalaryMin?: number;
      annualSalaryMax?: number;
    }>;
  };

  const jobs = data.jobs ?? [];
  const isEntrySearch = hasEntryLevelRoleTypes(input.roleTypes);
  const out: NormalizedJob[] = [];

  for (const j of jobs) {
    if (j.id == null || !j.jobTitle) continue;

    const title = j.jobTitle.trim();
    const level = (j.jobLevel ?? "").toLowerCase();

    // Seniority filtering for entry-level searches
    if (isEntrySearch) {
      if (SENIOR_RE.test(title)) continue;
      if (level && /\b(senior|lead|manager|director|executive)\b/.test(level)) continue;
    }

    const desc = (j.jobExcerpt ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
    let salary = "";
    if (j.annualSalaryMin != null && j.annualSalaryMax != null) {
      salary = `${j.annualSalaryMin}-${j.annualSalaryMax}`;
    }

    out.push({
      title,
      company: (j.companyName ?? "Unknown").trim(),
      location: (j.jobGeo ?? "Remote").trim(),
      description: desc,
      salary,
      job_url: (j.url ?? "").trim(),
      api_source: "jobicy",
      api_job_id: `jobicy-${j.id}`,
      is_remote: true,
      posted_at: j.pubDate ? new Date(j.pubDate).toISOString() : null,
    });
  }

  return out;
};
