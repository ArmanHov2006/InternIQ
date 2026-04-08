import type { NormalizedJob } from "./types";
import { hasEntryLevelRoleTypes } from "@/lib/services/career-os";

const JOOBLE_BASE = "https://jooble.org/api";

const toIsoOrNull = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const fetchJoobleJobs = async (input: {
  keywords: string[];
  locations: string[];
  roleTypes: string[];
  remoteQuery?: boolean;
  signal?: AbortSignal;
}): Promise<NormalizedJob[]> => {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    throw new Error("Jooble API key not configured");
  }

  const keywordParts: string[] = [];
  if (hasEntryLevelRoleTypes(input.roleTypes)) {
    keywordParts.push("intern OR junior OR entry level");
  }
  if (input.keywords.length > 0) {
    keywordParts.push(input.keywords.slice(0, 3).join(" "));
  }
  if (input.remoteQuery) {
    keywordParts.push("remote");
  }

  const location = input.remoteQuery ? "" : input.locations[0] ?? "";
  const res = await fetch(`${JOOBLE_BASE}/${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keywords: keywordParts.join(" ").trim(),
      location,
      page: "1",
    }),
    next: { revalidate: 0 },
    signal: input.signal,
  });

  if (!res.ok) {
    throw new Error(`Jooble HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    totalCount?: number;
    jobs?: Array<{
      title?: string;
      location?: string;
      salary?: string;
      snippet?: string;
      type?: string;
      source?: string;
      link?: string;
      company?: string;
      updated?: string;
    }>;
  };

  const jobs = data.jobs ?? [];
  const out: NormalizedJob[] = [];

  for (const job of jobs) {
    if (!job.title || !job.link) continue;

    const title = job.title.trim();
    const company = (job.company ?? "Unknown").trim() || "Unknown";
    const loc = (job.location ?? "").trim();
    const desc = (job.snippet ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
    const link = job.link.trim();

    out.push({
      title,
      company,
      location: loc,
      description: desc,
      salary: (job.salary ?? "").trim(),
      job_url: link,
      api_source: "jooble",
      api_job_id: `jooble-${Buffer.from(link).toString("base64url").slice(0, 40)}`,
      is_remote: /\bremote\b/i.test(`${title} ${loc} ${job.type ?? ""}`),
      posted_at: toIsoOrNull(job.updated),
    });
  }

  return out;
};
