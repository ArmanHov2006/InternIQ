import type { NormalizedJob } from "./types";
import { hasEntryLevelRoleTypes } from "@/lib/services/career-os";

const REMOTEOK_URL = "https://remoteok.com/api";

const SENIOR_RE = /\b(senior|sr\.?|staff|lead|principal|director|vp|chief|head|architect|manager)\b/i;
const ENTRY_RE = /\b(intern(ship)?|junior|entry[\s-]?level|co[\s-]?op|new grad|graduate|student)\b/i;

export const fetchRemoteOKJobs = async (input: {
  keywords: string[];
  roleTypes: string[];
}): Promise<NormalizedJob[]> => {
  const res = await fetch(REMOTEOK_URL, {
    next: { revalidate: 0 },
    headers: {
      "User-Agent": "InternIQ/1.0 (job-discovery)",
    },
  });
  if (!res.ok) {
    throw new Error(`RemoteOK HTTP ${res.status}`);
  }

  // RemoteOK returns a JSON array; the first element is metadata (legal notice), skip it
  const raw = (await res.json()) as Array<{
    id?: number;
    position?: string;
    company?: string;
    location?: string;
    description?: string;
    url?: string;
    date?: string;
    salary_min?: number;
    salary_max?: number;
    tags?: string[];
  }>;

  // Skip the first element (metadata/legal)
  const jobs = Array.isArray(raw) ? raw.slice(1) : [];
  const isEntrySearch = hasEntryLevelRoleTypes(input.roleTypes);
  const keywordNeedle = input.keywords.map((k) => k.toLowerCase()).filter(Boolean);
  const out: NormalizedJob[] = [];

  for (const j of jobs) {
    if (j.id == null || !j.position) continue;

    const title = j.position.trim();
    const desc = (j.description ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
    const tags = Array.isArray(j.tags) ? j.tags.join(" ") : "";

    // Seniority filtering for entry-level searches
    if (isEntrySearch) {
      if (SENIOR_RE.test(title)) continue;
      // If there are entry-level signals, prefer those; otherwise require keyword match
      const isEntry = ENTRY_RE.test(title) || ENTRY_RE.test(tags);
      if (!isEntry) {
        // Require at least 1 keyword match for non-entry-labeled jobs
        const hay = `${title} ${desc} ${tags}`.toLowerCase();
        const matchCount = keywordNeedle.filter((k) => hay.includes(k)).length;
        if (matchCount < 1) continue;
      }
    } else {
      // For non-entry searches, still require keyword relevance
      if (keywordNeedle.length > 0) {
        const hay = `${title} ${desc} ${tags}`.toLowerCase();
        const matchCount = keywordNeedle.filter((k) => hay.includes(k)).length;
        if (matchCount < 1) continue;
      }
    }

    let salary = "";
    if (j.salary_min != null && j.salary_max != null) {
      salary = `${j.salary_min}-${j.salary_max}`;
    }

    out.push({
      title,
      company: (j.company ?? "Unknown").trim(),
      location: (j.location ?? "Remote").trim() || "Remote",
      description: desc,
      salary,
      job_url: (j.url ?? "").trim(),
      api_source: "remoteok",
      api_job_id: `remoteok-${j.id}`,
      is_remote: true,
      posted_at: j.date ? new Date(j.date).toISOString() : null,
    });
  }

  return out;
};
