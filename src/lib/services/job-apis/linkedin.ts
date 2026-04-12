import type { NormalizedJob } from "./types";
import { hasEntryLevelRoleTypes } from "@/lib/services/career-os";

const LINKEDIN_JOBS_BASE = "https://linkedin-data-api.p.rapidapi.com/search-jobs";

const buildQuery = (
  keywords: string[],
  roleTypes: string[]
): string => {
  const parts: string[] = [];

  if (keywords.length > 0) {
    parts.push(keywords.slice(0, 3).join(" "));
  }

  if (hasEntryLevelRoleTypes(roleTypes)) {
    parts.push("intern");
  }

  return parts.join(" ") || "software intern";
};

export const fetchLinkedInJobs = async (input: {
  keywords: string[];
  locations: string[];
  roleTypes: string[];
  remoteQuery?: boolean;
  signal?: AbortSignal;
}): Promise<NormalizedJob[]> => {
  const apiKey = process.env.LINKEDIN_RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("LinkedIn RapidAPI key not configured");
  }

  const query = buildQuery(input.keywords, input.roleTypes);
  const params = new URLSearchParams({
    keywords: query,
    datePosted: "pastMonth",
    sort: "mostRelevant",
  });

  if (input.locations.length > 0 && !input.remoteQuery) {
    params.set("locationId", input.locations[0]);
  }

  if (hasEntryLevelRoleTypes(input.roleTypes)) {
    params.set("experienceLevel", "internship");
  }

  const res = await fetch(`${LINKEDIN_JOBS_BASE}?${params.toString()}`, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "linkedin-data-api.p.rapidapi.com",
    },
    next: { revalidate: 0 },
    signal: input.signal,
  });

  if (res.status === 429) {
    throw new Error("LinkedIn rate limited (HTTP 429)");
  }

  if (!res.ok) {
    throw new Error(`LinkedIn HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    data?: Array<{
      id?: string;
      title?: string;
      company?: { name?: string };
      location?: string;
      url?: string;
      postAt?: string;
      type?: string;
      description?: string;
    }>;
  };

  return (data.data ?? [])
    .filter((job) => job.id && job.title)
    .map((job) => {
      const isRemote =
        /remote/i.test(job.location ?? "") ||
        /remote/i.test(job.type ?? "");

      return {
        title: job.title!.trim(),
        company: (job.company?.name ?? "Unknown").trim(),
        location: job.location || (isRemote ? "Remote" : ""),
        description: (job.description ?? "").slice(0, 8000),
        salary: "",
        job_url: (job.url ?? "").trim(),
        api_source: "linkedin" as const,
        api_job_id: `linkedin-${job.id}`,
        is_remote: isRemote,
        posted_at: job.postAt ? new Date(job.postAt).toISOString() : null,
      };
    });
};
