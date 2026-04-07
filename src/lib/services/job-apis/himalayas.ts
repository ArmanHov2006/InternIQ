import type { NormalizedJob } from "./types";

const HIMALAYAS_BASE = "https://himalayas.app/jobs/api";

const SENIOR_RE = /\b(senior|sr\.?|staff|lead|principal|director|vp|chief|head|architect|manager)\b/i;
const ENTRY_RE = /\b(intern(ship)?|junior|entry[\s-]?level|co[\s-]?op|new grad|graduate|student)\b/i;

export const fetchHimalayasJobs = async (input: {
  keywords: string[];
  roleTypes: string[];
}): Promise<NormalizedJob[]> => {
  const hasEntryLevel = input.roleTypes.some((r) =>
    /\b(intern(ship)?|junior|entry[\s-]?level|co[\s-]?op|new grad|graduate)\b/i.test(r)
  );

  const params = new URLSearchParams({ limit: "20", offset: "0" });
  if (input.keywords.length > 0) {
    params.set("q", input.keywords.slice(0, 3).join(" "));
  }

  const url = `${HIMALAYAS_BASE}?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Himalayas HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    jobs?: Array<{
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
      categories?: string[];
    }>;
  };

  const jobs = data.jobs ?? [];
  const out: NormalizedJob[] = [];

  for (const j of jobs) {
    const jobId = j.guid ?? (j.id != null ? String(j.id) : "");
    if (!jobId || !j.title) continue;

    // Normalize seniority — API returns array or string
    const seniorityRaw = Array.isArray(j.seniority)
      ? j.seniority.join(" ")
      : (j.seniority ?? "");
    const seniorityLower = seniorityRaw.toLowerCase();

    if (hasEntryLevel) {
      const title = j.title.toLowerCase();
      const isEntry =
        /\b(entry|junior|intern|graduate|student)\b/.test(seniorityLower) ||
        ENTRY_RE.test(title);
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
