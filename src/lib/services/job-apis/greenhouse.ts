import type { NormalizedJob } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const fetchGreenhouseJobsForSlug = async (slug: string): Promise<NormalizedJob[]> => {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Greenhouse ${slug}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    jobs?: Array<{
      id?: number;
      title?: string;
      absolute_url?: string;
      updated_at?: string;
      content?: string;
      metadata?: Array<{ name?: string; value?: string }>;
    }>;
  };

  const jobs = data.jobs ?? [];
  const out: NormalizedJob[] = [];

  for (const j of jobs) {
    if (j.id == null || !j.title) continue;
    const desc = (j.content ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
    const loc =
      j.metadata?.find((m) => (m.name ?? "").toLowerCase() === "location")?.value ?? "";
    out.push({
      title: j.title.trim(),
      company: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      location: loc.trim(),
      description: desc,
      salary: "",
      job_url: (j.absolute_url ?? "").trim(),
      api_source: "greenhouse",
      api_job_id: `greenhouse-${slug}-${j.id}`,
      is_remote: /\bremote\b/i.test(`${j.title} ${desc} ${loc}`),
      posted_at: j.updated_at ? new Date(j.updated_at).toISOString() : null,
    });
  }

  return out;
};

export const fetchGreenhouseJobs = async (
  slugs: string[],
  maxSlugs: number
): Promise<{ jobs: NormalizedJob[]; errors: Record<string, string> }> => {
  const trimmed = slugs.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const slice = trimmed.slice(0, maxSlugs);
  const jobs: NormalizedJob[] = [];
  const errors: Record<string, string> = {};

  for (let i = 0; i < slice.length; i += 1) {
    const slug = slice[i]!;
    try {
      const batch = await fetchGreenhouseJobsForSlug(slug);
      jobs.push(...batch);
    } catch (e) {
      errors[slug] = e instanceof Error ? e.message : "Unknown error";
    }
    if (i < slice.length - 1) await sleep(150);
  }

  return { jobs, errors };
};
