import type { NormalizedJob } from "./types";

const HIMALAYAS_BASE = "https://himalayas.app/jobs/api";

const SENIOR_RE = /\b(senior|sr\.?|staff|lead|principal|director|vp|chief|head|architect|manager)\b/i;
const ENTRY_RE = /\b(intern(ship)?|junior|entry[\s-]?level|co[\s-]?op|new grad|graduate|student)\b/i;

type HimalayasJob = {
  guid?: string;
  id?: number;
  title?: string;
  companyName?: string;
  locationRestrictions?: string[];
  description?: string;
  minSalary?: number;
  maxSalary?: number;
  applicationLink?: string;
  pubDate?: string;
  seniority?: string[] | string;
};

const normalizeBatch = (
  jobs: HimalayasJob[],
  hasEntryLevel: boolean
): NormalizedJob[] => {
  const out: NormalizedJob[] = [];

  for (const j of jobs) {
    const jobId = j.guid ?? (j.id != null ? String(j.id) : "");
    if (!jobId || !j.title) continue;

    const seniorityRaw = Array.isArray(j.seniority) ? j.seniority.join(" ") : j.seniority ?? "";
    const seniorityLower = seniorityRaw.toLowerCase();

    if (hasEntryLevel) {
      const title = j.title.toLowerCase();
      const isEntry =
        /\b(entry|junior|intern|graduate|student)\b/.test(seniorityLower) || ENTRY_RE.test(title);
      const isSenior = SENIOR_RE.test(j.title);
      if (isSenior) continue;
      if (!isEntry && seniorityLower && !/\b(mid|middle)\b/.test(seniorityLower)) continue;
    }

    const loc = Array.isArray(j.locationRestrictions) ? j.locationRestrictions.join(", ") : "";
    const desc = (j.description ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
    let salary = "";
    if (j.minSalary != null && j.maxSalary != null) {
      salary = `${j.minSalary}-${j.maxSalary}`;
    }

    out.push({
      title: j.title.trim(),
      company: (j.companyName ?? "Unknown").trim(),
      location: loc || "Remote",
      description: desc,
      salary,
      job_url: (j.applicationLink ?? "").trim(),
      api_source: "himalayas",
      api_job_id: `himalayas-${jobId}`,
      is_remote: true,
      posted_at: j.pubDate ? new Date(j.pubDate).toISOString() : null,
    });
  }

  return out;
};

export const fetchHimalayasJobs = async (input: {
  keywords: string[];
  roleTypes: string[];
  offsets?: number[];
  signal?: AbortSignal;
}): Promise<NormalizedJob[]> => {
  const hasEntryLevel = input.roleTypes.some((r) =>
    /\b(intern(ship)?|junior|entry[\s-]?level|co[\s-]?op|new grad|graduate)\b/i.test(r)
  );
  const offsets = input.offsets && input.offsets.length > 0 ? input.offsets : [0];

  const settled = await Promise.allSettled(
    offsets.map(async (offset) => {
      const params = new URLSearchParams({ limit: "20", offset: String(offset) });
      if (input.keywords.length > 0) {
        params.set("q", input.keywords.slice(0, 3).join(" "));
      }

      const url = `${HIMALAYAS_BASE}?${params.toString()}`;
      const res = await fetch(url, { next: { revalidate: 0 }, signal: input.signal });
      if (!res.ok) {
        throw new Error(`Himalayas HTTP ${res.status}`);
      }

      const data = (await res.json()) as { jobs?: HimalayasJob[] };
      return normalizeBatch(data.jobs ?? [], hasEntryLevel);
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
