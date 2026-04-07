import type { NormalizedJob } from "./types";
import { hasEntryLevelRoleTypes, isEntryLevelSeniorityMismatch } from "@/lib/services/career-os";

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";

const SENIOR_TITLE_RE = /\b(senior|sr\.?|staff|lead|principal|director|vp|chief|head|architect|manager)\b/i;
const EXPERIENCE_YEARS_RE = /\b(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp\.?)\b/i;

const internish = (title: string, category: string, tags: string): boolean => {
  const blob = `${title} ${category} ${tags}`.toLowerCase();
  return (
    /\b(intern|internship|entry[\s-]?level|junior|graduate|new grad)\b/.test(blob) ||
    /\b(student)\b/.test(blob)
  );
};

/**
 * When searching for entry-level roles, skip jobs that look mid/senior
 * even if they match on keywords. Checks title AND description.
 */
const isTooSeniorForEntryLevel = (title: string, description: string): boolean => {
  if (SENIOR_TITLE_RE.test(title)) return true;
  const match = EXPERIENCE_YEARS_RE.exec(description);
  if (match) {
    const years = parseInt(match[1]!, 10);
    if (years >= 4) return true;
  }
  return false;
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
  const isEntrySearch = hasEntryLevelRoleTypes(input.roleTypes);
  const out: NormalizedJob[] = [];

  for (const j of jobs) {
    if (j.id == null || !j.title) continue;
    const title = j.title.trim();
    const desc = (j.description ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);

    // Strict seniority filtering for entry-level searches
    if (isEntrySearch && isTooSeniorForEntryLevel(title, desc)) continue;

    // Standard seniority mismatch check
    if (isEntryLevelSeniorityMismatch(title, input.roleTypes)) continue;

    // For entry-level searches, REQUIRE entry-level signals OR at least 2 keyword matches
    // (not just 1 keyword, which was too loose)
    const isEntry = internish(title, j.category ?? "", j.tags ?? "");
    if (!isEntry) {
      if (keywordNeedle.length === 0) continue;
      const hay = `${title} ${desc}`.toLowerCase();
      const matchCount = keywordNeedle.filter((k) => hay.includes(k)).length;
      // Require at least 2 keyword matches for non-entry-labeled jobs
      if (matchCount < 2) continue;
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
