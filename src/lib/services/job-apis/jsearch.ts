import type { NormalizedJob } from "./types";
import { hasEntryLevelRoleTypes } from "@/lib/services/career-os";

const JSEARCH_BASE = "https://jsearch.p.rapidapi.com/search";

const buildQuery = (
  keywords: string[],
  locations: string[],
  roleTypes: string[],
  remoteQuery = false
): string => {
  const parts: string[] = [];

  if (keywords.length > 0) {
    parts.push(keywords.slice(0, 3).join(" "));
  }

  if (hasEntryLevelRoleTypes(roleTypes)) {
    parts.push("intern OR junior OR entry level");
  }

  if (remoteQuery) {
    parts.push("remote");
  } else if (locations.length > 0) {
    parts.push(`in ${locations[0]}`);
  }

  return parts.join(" ") || (remoteQuery ? "remote software intern" : "software intern");
};

export const fetchJSearchJobs = async (input: {
  keywords: string[];
  locations: string[];
  roleTypes: string[];
  remoteQuery?: boolean;
  signal?: AbortSignal;
}): Promise<NormalizedJob[]> => {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("JSearch API key not configured");
  }

  const query = buildQuery(input.keywords, input.locations, input.roleTypes, input.remoteQuery);
  const employmentTypes = hasEntryLevelRoleTypes(input.roleTypes) ? "INTERN,FULLTIME" : "FULLTIME";
  const params = new URLSearchParams({
    query,
    page: "1",
    num_pages: "1",
    date_posted: "month",
    employment_types: employmentTypes,
  });

  const res = await fetch(`${JSEARCH_BASE}?${params.toString()}`, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
    next: { revalidate: 0 },
    signal: input.signal,
  });

  if (res.status === 429) {
    throw new Error("JSearch rate limited (HTTP 429, likely free-tier quota exhausted)");
  }

  if (!res.ok) {
    throw new Error(`JSearch HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    data?: Array<{
      job_id?: string;
      job_title?: string;
      employer_name?: string;
      job_city?: string;
      job_state?: string;
      job_country?: string;
      job_description?: string;
      job_min_salary?: number | null;
      job_max_salary?: number | null;
      job_apply_link?: string;
      job_posted_at_datetime_utc?: string;
      job_is_remote?: boolean;
    }>;
  };

  return (data.data ?? [])
    .filter((job) => job.job_id && job.job_title)
    .map((job) => {
      const location = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ");
      const description = (job.job_description ?? "").slice(0, 8000);
      const salary =
        job.job_min_salary != null && job.job_max_salary != null
          ? `${job.job_min_salary}-${job.job_max_salary}`
          : "";

      return {
        title: job.job_title!.trim(),
        company: (job.employer_name ?? "Unknown").trim(),
        location: location || (job.job_is_remote ? "Remote" : ""),
        description,
        salary,
        job_url: (job.job_apply_link ?? "").trim(),
        api_source: "jsearch" as const,
        api_job_id: `jsearch-${job.job_id}`,
        is_remote: Boolean(job.job_is_remote),
        posted_at: job.job_posted_at_datetime_utc
          ? new Date(job.job_posted_at_datetime_utc).toISOString()
          : null,
      };
    });
};
