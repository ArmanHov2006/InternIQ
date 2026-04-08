import { fetchAdzunaJobs } from "./adzuna";
import { fetchGreenhouseJobs } from "./greenhouse";
import { fetchHimalayasJobs } from "./himalayas";
import { fetchJobicyJobs } from "./jobicy";
import { fetchJSearchJobs } from "./jsearch";
import { fetchRemoteOKJobs } from "./remoteok";
import { fetchJoobleJobs } from "./jooble";
import { fetchSearchApiJobs } from "./searchapi";
import { fetchTheMuseJobs } from "./themuse";
import { fetchUsajobsJobs } from "./usajobs";
import { hasEntryLevelRoleTypes, isEntryLevelSeniorityMismatch } from "@/lib/services/career-os";
import type {
  DiscoveryFetchInput,
  DiscoveryFetchResult,
  DiscoveryFetchStageCounts,
  NormalizedJob,
  RemotePreference,
  SourceFetchResult,
} from "./types";

export type {
  DiscoveryFetchInput,
  DiscoveryFetchResult,
  DiscoveryFetchStageCounts,
  NormalizedJob,
  RemotePreference,
  SourceFetchResult,
} from "./types";

const GREENHOUSE_MAX_SLUGS = 20;
const FUZZY_JACCARD_MIN = 0.85;
const DEFAULT_SOURCE_TIMEOUT_MS = 12_000;

export type SourceQuerySpec = {
  locations: string[];
  remoteQuery: boolean;
};

type SourceExecutionResult = {
  jobs: NormalizedJob[];
  error?: string;
  timedOut?: boolean;
};

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
  userLocations: string[],
  remotePreference: RemotePreference
): boolean => {
  if (userLocations.length === 0) return true;

  const hasRemote = userLocations.some((l) => /^remote$/i.test(l.trim()));
  const allowsRemoteOutsideCity =
    remotePreference === "any" ||
    remotePreference === "hybrid" ||
    remotePreference === "remote_only";
  if (job.is_remote && (hasRemote || allowsRemoteOutsideCity)) return true;

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

const uniqueNonEmpty = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))
  );

const isRemoteLocation = (location: string): boolean => /^remote$/i.test(location.trim());

const allowsRemoteExpansion = (remotePreference: RemotePreference): boolean =>
  remotePreference === "any" ||
  remotePreference === "hybrid" ||
  remotePreference === "remote_only";

export const buildLocationAwareQuerySpecs = (input: {
  locations: string[];
  remotePreference: RemotePreference;
}): SourceQuerySpec[] => {
  const normalizedLocations = uniqueNonEmpty(input.locations);
  const localLocations = normalizedLocations.filter((location) => !isRemoteLocation(location));
  const wantsRemoteQuery =
    allowsRemoteExpansion(input.remotePreference) &&
    (input.remotePreference === "remote_only" ||
      localLocations.length > 0 ||
      normalizedLocations.some(isRemoteLocation));

  const specs: SourceQuerySpec[] = [];

  if (input.remotePreference !== "remote_only" && localLocations.length > 0) {
    specs.push({ locations: localLocations, remoteQuery: false });
  }

  if (wantsRemoteQuery) {
    specs.push({
      locations: localLocations.length > 0 ? localLocations : normalizedLocations,
      remoteQuery: true,
    });
  }

  if (specs.length === 0) {
    specs.push({
      locations: normalizedLocations,
      remoteQuery: false,
    });
  }

  return specs;
};

const buildSourceQueryLocations = (specs: SourceQuerySpec[]): string[] =>
  uniqueNonEmpty(
    specs.flatMap((spec) => (spec.remoteQuery ? [...spec.locations, "Remote"] : spec.locations))
  );

const isAbortError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === "AbortError" ||
    /aborted/i.test(error.message) ||
    /timed out/i.test(error.message));

const formatSourceError = (source: string, error: unknown, timeoutMs: number): string => {
  if (isAbortError(error)) {
    return `${source} timed out after ${Math.round(timeoutMs / 1000)}s`;
  }
  return error instanceof Error ? error.message : `${source} failed`;
};

const executeSource = async (
  source: SourceFetchResult["source"],
  timeoutMs: number,
  runner: (signal: AbortSignal) => Promise<SourceExecutionResult>
): Promise<SourceFetchResult> => {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await runner(controller.signal);
    return {
      source,
      jobs: dedupeNormalizedJobsFuzzy(result.jobs),
      durationMs: Date.now() - startedAt,
      timedOut: Boolean(result.timedOut),
      error: result.error,
    };
  } catch (error) {
    return {
      source,
      jobs: [],
      durationMs: Date.now() - startedAt,
      timedOut: isAbortError(error),
      error: formatSourceError(source, error, timeoutMs),
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

const runLocationAwareSource = (
  source: SourceFetchResult["source"],
  specs: SourceQuerySpec[],
  timeoutMs: number,
  fetcher: (input: {
    locations: string[];
    remoteQuery: boolean;
    signal: AbortSignal;
  }) => Promise<NormalizedJob[]>
): ((signal: AbortSignal) => Promise<SourceExecutionResult>) => {
  return async (signal: AbortSignal) => {
    const settled = await Promise.allSettled(
      specs.map((spec) =>
        fetcher({
          locations: spec.locations,
          remoteQuery: spec.remoteQuery,
          signal,
        })
      )
    );

    const jobs: NormalizedJob[] = [];
    const queryErrors: string[] = [];
    let timedOut = false;

    settled.forEach((result, index) => {
      const spec = specs[index]!;
      const label = spec.remoteQuery
        ? "remote-friendly query"
        : spec.locations.slice(0, 2).join(", ") || "location query";

      if (result.status === "fulfilled") {
        jobs.push(...result.value);
        return;
      }

      timedOut = timedOut || isAbortError(result.reason);

      queryErrors.push(
        `${label}: ${formatSourceError(source, result.reason, timeoutMs)}`
      );
    });

    return {
      jobs,
      timedOut,
      error: queryErrors.length > 0 ? queryErrors.join("; ") : undefined,
    };
  };
};

export const filterDiscoveryJobs = (
  jobs: NormalizedJob[],
  input: DiscoveryFetchInput
): { jobs: NormalizedJob[]; stageCounts: DiscoveryFetchStageCounts } => {
  const fetched = jobs.length;
  let filtered = jobs.filter((job) => passesRemoteFilter(job, input.remotePreference));
  const afterRemote = filtered.length;
  filtered = filtered.filter((job) =>
    passesLocationFilter(job, input.locations, input.remotePreference)
  );
  const afterLocation = filtered.length;
  filtered = filterJobsByRoleTypeSeniority(filtered, input.roleTypes);
  filtered = dedupeNormalizedJobsFuzzy(filtered);
  const afterSeniority = filtered.length;

  return {
    jobs: filtered,
    stageCounts: {
      fetched,
      afterRemote,
      afterLocation,
      afterSeniority,
    },
  };
};

export async function fetchAllDiscoveryJobs(
  input: DiscoveryFetchInput
): Promise<DiscoveryFetchResult> {
  const timeoutMs = Math.max(1_000, input.sourceTimeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS);
  const locationQuerySpecs = buildLocationAwareQuerySpecs({
    locations: input.sourceQueryLocations ?? input.locations,
    remotePreference: input.remotePreference,
  });
  const sourceQueryLocations =
    input.sourceQueryLocations && input.sourceQueryLocations.length > 0
      ? uniqueNonEmpty(input.sourceQueryLocations)
      : buildSourceQueryLocations(locationQuerySpecs);

  const tasks: Promise<SourceFetchResult>[] = [
    executeSource("adzuna", timeoutMs, runLocationAwareSource("adzuna", locationQuerySpecs, timeoutMs, ({ locations, remoteQuery, signal }) =>
      fetchAdzunaJobs({
        keywords: input.keywords,
        locations,
        roleTypes: input.roleTypes,
        maxPages: input.adzunaMaxPages ?? 2,
        remoteQuery,
        signal,
      })
    )),
    executeSource("greenhouse", timeoutMs, async (signal) => {
      const { jobs, errors } = await fetchGreenhouseJobs(
        input.greenhouseSlugs,
        GREENHOUSE_MAX_SLUGS,
        signal
      );
      return {
        jobs,
        error:
          Object.keys(errors).length > 0
            ? Object.entries(errors)
                .map(([slug, message]) => `${slug}: ${message}`)
                .join("; ")
            : undefined,
      };
    }),
    executeSource("himalayas", timeoutMs, async (signal) => ({
      jobs: await fetchHimalayasJobs({
        keywords: input.keywords,
        roleTypes: input.roleTypes,
        signal,
      }),
    })),
    executeSource("jobicy", timeoutMs, async (signal) => ({
      jobs: await fetchJobicyJobs({
        keywords: input.keywords,
        roleTypes: input.roleTypes,
        signal,
      }),
    })),
    executeSource("remoteok", timeoutMs, async (signal) => ({
      jobs: await fetchRemoteOKJobs({
        keywords: input.keywords,
        roleTypes: input.roleTypes,
        signal,
      }),
    })),
  ];

  if (process.env.THEMUSE_API_KEY?.trim()) {
    tasks.push(
      executeSource("themuse", timeoutMs, async (signal) => ({
        jobs: await fetchTheMuseJobs({ keywords: input.keywords, page: 1, signal }),
      }))
    );
  }

  if (process.env.JSEARCH_API_KEY?.trim()) {
    tasks.push(
      executeSource(
        "jsearch",
        timeoutMs,
        runLocationAwareSource("jsearch", locationQuerySpecs, timeoutMs, ({ locations, remoteQuery, signal }) =>
          fetchJSearchJobs({
            keywords: input.keywords,
            locations,
            roleTypes: input.roleTypes,
            remoteQuery,
            signal,
          })
        )
      )
    );
  }

  if (process.env.JOOBLE_API_KEY?.trim()) {
    tasks.push(
      executeSource(
        "jooble",
        timeoutMs,
        runLocationAwareSource("jooble", locationQuerySpecs, timeoutMs, ({ locations, remoteQuery, signal }) =>
          fetchJoobleJobs({
            keywords: input.keywords,
            locations,
            roleTypes: input.roleTypes,
            remoteQuery,
            signal,
          })
        )
      )
    );
  }

  if (process.env.USAJOBS_API_KEY?.trim()) {
    tasks.push(
      executeSource(
        "usajobs",
        timeoutMs,
        runLocationAwareSource("usajobs", locationQuerySpecs, timeoutMs, ({ locations, remoteQuery, signal }) =>
          fetchUsajobsJobs({
            keywords: input.keywords,
            locations,
            roleTypes: input.roleTypes,
            remoteQuery,
            signal,
          })
        )
      )
    );
  }

  if (process.env.SEARCHAPI_API_KEY?.trim()) {
    tasks.push(
      executeSource(
        "searchapi",
        timeoutMs,
        runLocationAwareSource("searchapi", locationQuerySpecs, timeoutMs, ({ locations, remoteQuery, signal }) =>
          fetchSearchApiJobs({
            keywords: input.keywords,
            locations,
            roleTypes: input.roleTypes,
            remoteQuery,
            signal,
          })
        )
      )
    );
  }

  const results = await Promise.all(tasks);

  const sourceErrors: Record<string, string> = {};
  const sourceStats: Record<string, DiscoveryFetchResult["sourceStats"][string]> = {};
  const combined: NormalizedJob[] = [];

  for (const result of results) {
    if (result.error) sourceErrors[result.source] = result.error;
    sourceStats[result.source] = {
      count: result.jobs.length,
      durationMs: result.durationMs,
      timedOut: result.timedOut,
      error: result.error ?? null,
    };
    combined.push(...result.jobs);
  }

  const included = combined.filter((job) => passesExcluded(job, input.excludedCompanies));
  const { jobs, stageCounts } = filterDiscoveryJobs(included, input);

  return { jobs, sourceErrors, sourceStats, sourceQueryLocations, stageCounts };
}
