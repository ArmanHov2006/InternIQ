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

  const url = `${JSEARCH_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
    next: { revalidate: 0 },
    signal: input.signal,
  });

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
      job_employment_type?: string;
    }>;
  };

  const jobs = data.data ?? [];
  const out: NormalizedJob[] = [];

  for (const j of jobs) {
    if (!j.job_id || !j.job_title) continue;

    const locParts = [j.job_city, j.job_state, j.job_country].filter(Boolean);
    const loc = locParts.join(", ");
    const desc = (j.job_description ?? "").slice(0, 8000);
    let salary = "";
    if (j.job_min_salary != null && j.job_max_salary != null) {
      salary = `${j.job_min_salary}-${j.job_max_salary}`;
    }

    out.push({
      title: j.job_title.trim(),
      company: (j.employer_name ?? "Unknown").trim(),
      location: loc || (j.job_is_remote ? "Remote" : ""),
      description: desc,
      salary,
      job_url: (j.job_apply_link ?? "").trim(),
      api_source: "jsearch",
      api_job_id: `jsearch-${j.job_id}`,
      is_remote: Boolean(j.job_is_remote),
      posted_at: j.job_posted_at_datetime_utc
        ? new Date(j.job_posted_at_datetime_utc).toISOString()
        : null,
    });
  }

  return out;
};
