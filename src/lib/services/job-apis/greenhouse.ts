import type { NormalizedJob } from "./types";

const abortError = () => new DOMException("The operation was aborted.", "AbortError");

const sleep = async (ms: number, signal?: AbortSignal) => {
  if (signal?.aborted) throw abortError();
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      cleanup();
      reject(abortError());
    };
    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
};

const isAbortError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === "AbortError" || /aborted/i.test(error.message) || /timed out/i.test(error.message));

type GreenhouseJob = {
  id?: number;
  title?: string;
  absolute_url?: string;
  updated_at?: string;
  content?: string;
  location?: { name?: string };
  metadata?: Array<{ name?: string; value?: string }>;
};

export const fetchGreenhouseJobsForSlug = async (
  slug: string,
  signal?: AbortSignal
): Promise<NormalizedJob[]> => {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
  const res = await fetch(url, { next: { revalidate: 0 }, signal });
  if (!res.ok) {
    throw new Error(`Greenhouse ${slug}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    jobs?: GreenhouseJob[];
  };

  const jobs = data.jobs ?? [];
  const out: NormalizedJob[] = [];

  for (const j of jobs) {
    if (j.id == null || !j.title) continue;
    const desc = (j.content ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
    const metadataLocation =
      j.metadata?.find((m) => (m.name ?? "").toLowerCase() === "location")?.value ?? "";
    const loc = j.location?.name?.trim() || metadataLocation.trim();
    out.push({
      title: j.title.trim(),
      company: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      location: loc,
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
  maxSlugs: number,
  signal?: AbortSignal
): Promise<{ jobs: NormalizedJob[]; errors: Record<string, string>; timedOut: boolean }> => {
  const trimmed = slugs.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const slice = trimmed.slice(0, maxSlugs);
  const jobs: NormalizedJob[] = [];
  const errors: Record<string, string> = {};
  let cursor = 0;
  let timedOut = false;

  const workerCount = Math.min(5, slice.length);

  const worker = async () => {
    while (true) {
      if (signal?.aborted) {
        timedOut = true;
        return;
      }

      const nextIndex = cursor;
      cursor += 1;
      const slug = slice[nextIndex];
      if (!slug) return;

      try {
        const batch = await fetchGreenhouseJobsForSlug(slug, signal);
        jobs.push(...batch);
      } catch (error) {
        if (isAbortError(error)) {
          timedOut = true;
          errors[slug] = `Greenhouse ${slug} timed out`;
          return;
        }
        errors[slug] = error instanceof Error ? error.message : "Unknown error";
      }

      if (nextIndex < slice.length - 1) {
        try {
          await sleep(150, signal);
        } catch (error) {
          if (isAbortError(error)) {
            timedOut = true;
            return;
          }
          throw error;
        }
      }
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return { jobs, errors, timedOut };
};
