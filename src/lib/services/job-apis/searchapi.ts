import type { NormalizedJob } from "./types";
import { hasEntryLevelRoleTypes } from "@/lib/services/career-os";

const SEARCHAPI_BASE = "https://www.searchapi.io/api/v1/search";

const parseRelativeDate = (value: string): string | null => {
  const match = /(\d+)\s+(hour|day|week|month)s?\s+ago/i.exec(value);
  if (!match) return null;

  const amount = parseInt(match[1]!, 10);
  const unit = match[2]!.toLowerCase();
  const multipliers: Record<string, number> = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };
  const ms = multipliers[unit];
  if (!ms) return null;

  return new Date(Date.now() - amount * ms).toISOString();
};

export const fetchSearchApiJobs = async (input: {
  keywords: string[];
  locations: string[];
  roleTypes: string[];
  remoteQuery?: boolean;
  signal?: AbortSignal;
}): Promise<NormalizedJob[]> => {
  const apiKey = process.env.SEARCHAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SearchApi API key not configured");
  }

  let query = input.keywords.slice(0, 3).join(" ");
  if (hasEntryLevelRoleTypes(input.roleTypes)) {
    query = `${query} intern OR junior OR entry level`.trim();
  }
  if (input.remoteQuery) {
    query = `${query} remote`.trim();
  }

  const params = new URLSearchParams({
    engine: "google_jobs",
    api_key: apiKey,
    q: query || (input.remoteQuery ? "remote software intern" : "software intern"),
    location: input.remoteQuery ? "Remote" : input.locations[0] || "United States",
    chips: "date_posted:week",
  });

  const url = `${SEARCHAPI_BASE}?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 0 }, signal: input.signal });

  if (!res.ok) {
    throw new Error(`SearchApi HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    jobs?: Array<{
      title?: string;
      company_name?: string;
      location?: string;
      description?: string;
      job_id?: string;
      share_link?: string;
      detected_extensions?: {
        salary?: string;
        work_from_home?: boolean;
        posted_at?: string;
      };
      apply_options?: Array<{
        title?: string;
        link?: string;
      }>;
    }>;
  };

  const jobs = data.jobs ?? [];
  const out: NormalizedJob[] = [];

  for (const job of jobs) {
    if (!job.title) continue;

    const title = job.title.trim();
    const company = (job.company_name ?? "Unknown").trim() || "Unknown";
    const location = (job.location ?? "").trim();

    out.push({
      title,
      company,
      location,
      description: (job.description ?? "").slice(0, 8000),
      salary: job.detected_extensions?.salary ?? "",
      job_url: job.apply_options?.[0]?.link?.trim() ?? job.share_link?.trim() ?? "",
      api_source: "searchapi",
      api_job_id: job.job_id
        ? `searchapi-${job.job_id}`
        : `searchapi-${Buffer.from(`${job.title ?? ""}${job.company_name ?? ""}`).toString("base64url").slice(0, 40)}`,
      is_remote:
        job.detected_extensions?.work_from_home === true ||
        /\bremote\b/i.test(`${title} ${location}`),
      posted_at: job.detected_extensions?.posted_at
        ? parseRelativeDate(job.detected_extensions.posted_at)
        : null,
    });
  }

  return out;
};
