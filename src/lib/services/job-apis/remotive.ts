import type { NormalizedJob } from "./types";
import { isEntryLevelSeniorityMismatch } from "@/lib/services/career-os";

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";

const internish = (title: string, category: string, tags: string): boolean => {
  const blob = `${title} ${category} ${tags}`.toLowerCase();
  return (
    /\b(intern|internship|entry[\s-]?level|junior|graduate|new grad)\b/.test(blob) ||
    /\b(student)\b/.test(blob)
  );
};

export const fetchRemotiveJobs = async (input: {
  keywords: string[];
  roleTypes: string[];
}): Promise<NormalizedJob[]> => {
  const res = await fetch(REMOTIVE_URL, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Remotive HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    jobs?: Array<{
      id?: number;
      title?: string;
      company_name?: string;
      candidate_required_location?: string;
      description?: string;
      salary?: string;
      url?: string;
      publication_date?: string;
      category?: string;
      job_type?: string;
      tags?: string;
    }>;
  };

  const jobs = data.jobs ?? [];
  const keywordNeedle = input.keywords.map((k) => k.toLowerCase()).filter(Boolean);
  const out: NormalizedJob[] = [];

  for (const j of jobs) {
    if (j.id == null || !j.title) continue;
    const title = j.title.trim();
    if (isEntryLevelSeniorityMismatch(title, input.roleTypes)) continue;

    const desc = (j.description ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
    if (!internish(title, j.category ?? "", j.tags ?? "")) {
      if (keywordNeedle.length === 0) continue;
      const hay = `${title} ${desc}`.toLowerCase();
      if (!keywordNeedle.some((k) => hay.includes(k))) continue;
    }
    out.push({
      title,
      company: (j.company_name ?? "Unknown").trim(),
      location: (j.candidate_required_location ?? "Remote").trim(),
      description: desc,
      salary: (j.salary ?? "").trim(),
      job_url: (j.url ?? "").trim(),
      api_source: "remotive",
      api_job_id: `remotive-${j.id}`,
      is_remote: true,
      posted_at: j.publication_date ? new Date(j.publication_date).toISOString() : null,
    });
  }

  return out;
};
