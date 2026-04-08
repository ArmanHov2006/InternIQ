import type { NormalizedJob } from "./types";

const MUSE_BASE = "https://www.themuse.com/api/public/jobs";

type MuseJob = {
  id?: number;
  name?: string;
  company?: { name?: string };
  locations?: Array<{ name?: string }>;
  contents?: string;
  refs?: { landing_page?: string };
  publication_date?: string;
};

const normalizeBatch = (results: MuseJob[], keywords: string[]): NormalizedJob[] => {
  const keywordNeedle = keywords.map((keyword) => keyword.toLowerCase()).filter(Boolean);

  return results
    .filter((job) => job.id != null && job.name)
    .map((job) => {
      const description = (job.contents ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
      const title = job.name!.trim();
      const location = (job.locations ?? []).map((item) => item.name).filter(Boolean).join(", ");

      return {
        title,
        company: (job.company?.name ?? "Unknown").trim(),
        location,
        description,
        salary: "",
        job_url: (job.refs?.landing_page ?? "").trim(),
        api_source: "themuse" as const,
        api_job_id: `themuse-${job.id}`,
        is_remote: /\bremote\b/i.test(`${title} ${description} ${location}`),
        posted_at: job.publication_date ? new Date(job.publication_date).toISOString() : null,
      };
    })
    .filter((job) => {
      if (keywordNeedle.length === 0) return true;
      const haystack = `${job.title} ${job.description}`.toLowerCase();
      return keywordNeedle.some((keyword) => haystack.includes(keyword));
    });
};

export const fetchTheMuseJobs = async (input: {
  keywords: string[];
  pageCount?: number;
  signal?: AbortSignal;
}): Promise<NormalizedJob[]> => {
  const apiKey = process.env.THEMUSE_API_KEY?.trim();
  const pageCount = Math.max(1, Math.min(input.pageCount ?? 1, 3));
  const requests = Array.from({ length: pageCount }, async (_, index) => {
    const params = new URLSearchParams({
      page: String(index + 1),
      category: "all",
    });
    if (apiKey) {
      params.set("api_key", apiKey);
    }

    const res = await fetch(`${MUSE_BASE}?${params.toString()}`, {
      next: { revalidate: 0 },
      signal: input.signal,
    });
    if (!res.ok) {
      throw new Error(`The Muse HTTP ${res.status}`);
    }

    const data = (await res.json()) as { results?: MuseJob[] };
    return normalizeBatch(data.results ?? [], input.keywords);
  });

  const settled = await Promise.allSettled(requests);
  const jobs: NormalizedJob[] = [];

  for (const result of settled) {
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
      continue;
    }
    throw result.reason;
  }

  return jobs;
};
