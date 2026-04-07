import { fetchAdzunaJobs } from "./adzuna";
import { fetchGreenhouseJobs } from "./greenhouse";
import { fetchHimalayasJobs } from "./himalayas";
import { fetchJobicyJobs } from "./jobicy";
import { fetchJSearchJobs } from "./jsearch";
import { fetchRemoteOKJobs } from "./remoteok";
import { fetchTheMuseJobs } from "./themuse";
import { hasEntryLevelRoleTypes, isEntryLevelSeniorityMismatch } from "@/lib/services/career-os";
import type { DiscoveryFetchInput, NormalizedJob, RemotePreference, SourceFetchResult } from "./types";

export type { DiscoveryFetchInput, NormalizedJob, RemotePreference, SourceFetchResult } from "./types";

const GREENHOUSE_MAX_SLUGS = 20;
const FUZZY_JACCARD_MIN = 0.85;

export const normalizeCompanyName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co\.)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const tokenSet = (value: string): Set<string> =>
  new Set(
    value
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2)
  );

export const titleSimilarity = (a: string, b: string): number => {
  const A = tokenSet(a);
  const B = tokenSet(b);
  let inter = 0;
  A.forEach((x) => {
    if (B.has(x)) inter += 1;
  });
  const uni = A.size + B.size - inter;
  return uni === 0 ? 0 : inter / uni;
};

const passesRemoteFilter = (job: NormalizedJob, pref: RemotePreference): boolean => {
  if (pref === "any") return true;
  if (pref === "remote_only") return job.is_remote;
  if (pref === "onsite") return !job.is_remote || /\b(on-?site|hybrid)\b/i.test(job.location);
  if (pref === "hybrid") return job.is_remote || /\bhybrid\b/i.test(`${job.location} ${job.description}`);
  return true;
};

const passesExcluded = (job: NormalizedJob, excluded: string[]): boolean => {
  if (excluded.length === 0) return true;
  const companyNorm = normalizeCompanyName(job.company);
  return !excluded.some((ex) => {
    const n = normalizeCompanyName(ex);
    return n.length > 0 && (companyNorm === n || companyNorm.includes(n) || n.includes(companyNorm));
  });
};

const normalizeLocationTerm = (loc: string): string =>
  loc.toLowerCase().replace(/[,.\s]+/g, " ").trim();

/**
 * Post-fetch location filter. If the user specified locations, a job must match
 * at least one. "Remote" in the user's list lets any remote job through.
 * If no locations are specified, everything passes.
 */
const passesLocationFilter = (
  job: NormalizedJob,
  userLocations: string[]
): boolean => {
  if (userLocations.length === 0) return true;

  const hasRemote = userLocations.some((l) => /^remote$/i.test(l.trim()));
  if (hasRemote && job.is_remote) return true;

  const jobLoc = normalizeLocationTerm(job.location);
  if (!jobLoc) return userLocations.length === 0 || hasRemote;

  return userLocations.some((userLoc) => {
    if (/^remote$/i.test(userLoc.trim())) return false; // already handled above
    const needle = normalizeLocationTerm(userLoc);
    if (!needle) return false;
    // Check if any word from the user location appears in the job location
    // e.g. "Toronto" matches "Toronto, ON, Canada"
    return needle.split(/\s+/).some((word) => word.length >= 3 && jobLoc.includes(word));
  });
};

const EXPERIENCE_YEARS_REGEX = /\b(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp\.?)\b/i;

/**
 * Enhanced seniority filter: blocks explicit senior/exec titles AND
 * jobs requiring 4+ years of experience when searching for entry-level.
 */
export const filterJobsByRoleTypeSeniority = (
  jobs: NormalizedJob[],
  roleTypes: string[]
): NormalizedJob[] => {
  if (!hasEntryLevelRoleTypes(roleTypes)) return jobs;

  return jobs.filter((job) => {
    // Block explicit senior/executive titles
    if (isEntryLevelSeniorityMismatch(job.title, roleTypes)) return false;

    // Block jobs requiring 4+ years of experience
    const match = EXPERIENCE_YEARS_REGEX.exec(job.description);
    if (match) {
      const years = parseInt(match[1]!, 10);
      if (years >= 4) return false;
    }

    return true;
  });
};

export const dedupeNormalizedJobsFuzzy = (jobs: NormalizedJob[]): NormalizedJob[] => {
  const kept: NormalizedJob[] = [];
  const seenIds = new Set<string>();

  for (const job of jobs) {
    const idKey = `${job.api_source}:${job.api_job_id}`;
    if (seenIds.has(idKey)) continue;
    seenIds.add(idKey);

    const companyNorm = normalizeCompanyName(job.company);
    const dup = kept.some(
      (k) =>
        normalizeCompanyName(k.company) === companyNorm &&
        titleSimilarity(k.title, job.title) >= FUZZY_JACCARD_MIN
    );
    if (!dup) kept.push(job);
  }

  return kept;
};

export async function fetchAllDiscoveryJobs(
  input: DiscoveryFetchInput
): Promise<{ jobs: NormalizedJob[]; sourceErrors: Record<string, string> }> {
  const tasks: Promise<SourceFetchResult>[] = [
    (async (): Promise<SourceFetchResult> => {
      try {
        const jobs = await fetchAdzunaJobs({
          keywords: input.keywords,
          locations: input.locations,
          roleTypes: input.roleTypes,
          maxPages: input.adzunaMaxPages ?? 2,
        });
        return { source: "adzuna", jobs };
      } catch (e) {
        return {
          source: "adzuna",
          jobs: [],
          error: e instanceof Error ? e.message : "Adzuna failed",
        };
      }
    })(),
(async (): Promise<SourceFetchResult> => {
      try {
        const { jobs, errors } = await fetchGreenhouseJobs(input.greenhouseSlugs, GREENHOUSE_MAX_SLUGS);
        const errMsg =
          Object.keys(errors).length > 0 ? Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join("; ") : undefined;
        return { source: "greenhouse", jobs, error: errMsg };
      } catch (e) {
        return {
          source: "greenhouse",
          jobs: [],
          error: e instanceof Error ? e.message : "Greenhouse failed",
        };
      }
    })(),
  ];

  tasks.push(
    (async (): Promise<SourceFetchResult> => {
      try {
        const jobs = await fetchHimalayasJobs({
          keywords: input.keywords,
          roleTypes: input.roleTypes,
        });
        return { source: "himalayas", jobs };
      } catch (e) {
        return {
          source: "himalayas",
          jobs: [],
          error: e instanceof Error ? e.message : "Himalayas failed",
        };
      }
    })()
  );

  tasks.push(
    (async (): Promise<SourceFetchResult> => {
      try {
        const jobs = await fetchJobicyJobs({
          keywords: input.keywords,
          roleTypes: input.roleTypes,
        });
        return { source: "jobicy", jobs };
      } catch (e) {
        return {
          source: "jobicy",
          jobs: [],
          error: e instanceof Error ? e.message : "Jobicy failed",
        };
      }
    })()
  );

  tasks.push(
    (async (): Promise<SourceFetchResult> => {
      try {
        const jobs = await fetchRemoteOKJobs({
          keywords: input.keywords,
          roleTypes: input.roleTypes,
        });
        return { source: "remoteok", jobs };
      } catch (e) {
        return {
          source: "remoteok",
          jobs: [],
          error: e instanceof Error ? e.message : "RemoteOK failed",
        };
      }
    })()
  );

  if (process.env.THEMUSE_API_KEY?.trim()) {
    tasks.push(
      (async (): Promise<SourceFetchResult> => {
        try {
          const jobs = await fetchTheMuseJobs({ keywords: input.keywords, page: 1 });
          return { source: "themuse", jobs };
        } catch (e) {
          return {
            source: "themuse",
            jobs: [],
            error: e instanceof Error ? e.message : "The Muse failed",
          };
        }
      })()
    );
  }

  if (process.env.JSEARCH_API_KEY?.trim()) {
    tasks.push(
      (async (): Promise<SourceFetchResult> => {
        try {
          const jobs = await fetchJSearchJobs({
            keywords: input.keywords,
            locations: input.locations,
            roleTypes: input.roleTypes,
          });
          return { source: "jsearch", jobs };
        } catch (e) {
          return {
            source: "jsearch",
            jobs: [],
            error: e instanceof Error ? e.message : "JSearch failed",
          };
        }
      })()
    );
  }

  const settled = await Promise.allSettled(tasks);

  const sourceErrors: Record<string, string> = {};
  const combined: NormalizedJob[] = [];

  for (const s of settled) {
    if (s.status === "fulfilled") {
      const r = s.value;
      if (r.error) sourceErrors[r.source] = r.error;
      combined.push(...r.jobs);
    } else {
      sourceErrors.unknown = s.reason instanceof Error ? s.reason.message : "Unknown source error";
    }
  }

  let filtered = combined.filter((j) => passesRemoteFilter(j, input.remotePreference));
  filtered = filtered.filter((j) => passesLocationFilter(j, input.locations));
  filtered = filtered.filter((j) => passesExcluded(j, input.excludedCompanies));
  filtered = filterJobsByRoleTypeSeniority(filtered, input.roleTypes);
  filtered = dedupeNormalizedJobsFuzzy(filtered);

  return { jobs: filtered, sourceErrors };
}
