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
  const keywordNeedle = keywords.map((k) => k.toLowerCase()).filter(Boolean);
  const out: NormalizedJob[] = [];

  for (const r of results) {
    if (r.id == null || !r.name) continue;
    const desc = (r.contents ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
    const title = r.name.trim();
    if (keywordNeedle.length > 0) {
      const hay = `${title} ${desc}`.toLowerCase();
      if (!keywordNeedle.some((k) => hay.includes(k))) continue;
    }
    const locs = (r.locations ?? []).map((l) => l.name).filter(Boolean).join(", ");
    out.push({
      title,
      company: (r.company?.name ?? "Unknown").trim(),
      location: locs,
      description: desc,
      salary: "",
      job_url: (r.refs?.landing_page ?? "").trim(),
      api_source: "themuse",
      api_job_id: `themuse-${r.id}`,
      is_remote: /\bremote\b/i.test(`${title} ${desc} ${locs}`),
      posted_at: r.publication_date ? new Date(r.publication_date).toISOString() : null,
    });
  }

  return out;
};

export const fetchTheMuseJobs = async (input: {
  keywords: string[];
  pageCount?: number;
  signal?: AbortSignal;
}): Promise<NormalizedJob[]> => {
  const apiKey = process.env.THEMUSE_API_KEY;
  if (!apiKey) {
    throw new Error("The Muse API key not configured");
  }

  const pageCount = Math.max(1, Math.min(input.pageCount ?? 1, 3));
  const category = "all";
  const settled = await Promise.allSettled(
    Array.from({ length: pageCount }, async (_, index) => {
      const page = index + 1;
      const url = `${MUSE_BASE}?page=${page}&api_key=${encodeURIComponent(apiKey)}&category=${category}`;
      const res = await fetch(url, { next: { revalidate: 0 }, signal: input.signal });
      if (!res.ok) {
        throw new Error(`The Muse HTTP ${res.status}`);
      }
      const data = (await res.json()) as { results?: MuseJob[] };
      return normalizeBatch(data.results ?? [], input.keywords);
    })
  );

  const out: NormalizedJob[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      out.push(...result.value);
      continue;
    }
    throw result.reason;
  }

  return out;
};
