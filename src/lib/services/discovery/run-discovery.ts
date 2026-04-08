import type { SupabaseClient } from "@supabase/supabase-js";
import { getDiscoveryProfileContext } from "@/lib/server/resume-keywords";
import {
  buildApiDedupeKey,
  computeMatchInsight,
  inferBoardFromUrl,
} from "@/lib/services/career-os";
import {
  buildDiscoverySearchContext,
  buildResumeContextPreview,
  mergeDiscoveryPreferencesRow,
  type DiscoveryPreferencesRow as DiscoveryPreferencesRowType,
} from "@/lib/services/discovery/resume-context";
import { buildDiscoverySourceAvailability } from "@/lib/services/job-apis/source-registry";
import { buildLocationAwareQuerySpecs, fetchAllDiscoveryJobs } from "@/lib/services/job-apis";
import type {
  DiscoveryRunDiagnostics,
  DiscoveryRunReasonCode,
  Opportunity,
  RemotePreference,
} from "@/types/database";

export type DiscoveryPreferencesRow = DiscoveryPreferencesRowType;

const STALE_DISCOVERY_MISS_LIMIT = 3;

const uniqueNonEmpty = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))
    )
  );

const normalizeRemotePreference = (value: string | null | undefined): RemotePreference =>
  value === "remote_only" || value === "hybrid" || value === "onsite" || value === "any"
    ? value
    : "any";

const buildSourceQueryLocations = (locations: string[], remotePreference: RemotePreference) =>
  uniqueNonEmpty(
    buildLocationAwareQuerySpecs({ locations, remotePreference }).flatMap((spec) =>
      spec.remoteQuery ? [...spec.locations, "Remote"] : spec.locations
    )
  );

const DEFAULT_GREENHOUSE_SLUGS = [
  "stripe",
  "figma",
  "discord",
  "airbnb",
  "coinbase",
  "databricks",
  "instacart",
  "lyft",
  "pinterest",
  "reddit",
  "robinhood",
  "twitch",
  "vercel",
  "cloudflare",
  "asana",
  "dropbox",
  "gusto",
  "gitlab",
  "elastic",
];

export type RunDiscoveryOptions = {
  skipRateLimit?: boolean;
};

export type RunDiscoveryResult = {
  runId: string;
  newOpportunitiesCount: number;
  resultsCount: number;
  reviewedCount: number;
  activeCount: number;
  archivedCount: number;
  updatedCount: number;
  reactivatedCount: number;
  sourceErrors: Record<string, string>;
  diagnostics?: DiscoveryRunDiagnostics;
  inactive?: boolean;
  rateLimited?: boolean;
};

const buildEmptyDiagnostics = (
  remotePreference: RemotePreference
): DiscoveryRunDiagnostics => ({
  reasonCode: "no_source_results",
  secondaryIssues: [],
  effectiveContext: {
    locations: [],
    remote_preference: remotePreference,
    role_types: [],
  },
  executedContext: {
    keywords: [],
    locations: [],
    source_query_locations: [],
    role_types: [],
    remote_preference: remotePreference,
  },
  stageCounts: {
    fetched: 0,
    afterRemote: 0,
    afterLocation: 0,
    afterSeniority: 0,
    afterThreshold: 0,
    active: 0,
    inserted: 0,
    updated: 0,
    reactivated: 0,
  },
  sourceStats: {},
  sourceAvailability: buildDiscoverySourceAvailability(),
});

const classifyDiscoveryReasonCode = (input: {
  sourceErrors: Record<string, string>;
  fetched: number;
  afterRemote: number;
  afterLocation: number;
  afterSeniority: number;
  afterThreshold: number;
  active: number;
  updated: number;
  reactivated: number;
}): { reasonCode: DiscoveryRunReasonCode; secondaryIssues: DiscoveryRunReasonCode[] } => {
  let reasonCode: DiscoveryRunReasonCode;

  if (input.active > 0) {
    reasonCode = "success";
  } else if (input.fetched === 0) {
    reasonCode = Object.keys(input.sourceErrors).length > 0 ? "source_errors" : "no_source_results";
  } else if (input.afterRemote === 0 || input.afterLocation === 0) {
    reasonCode = "location_filtered_out";
  } else if (input.afterSeniority === 0) {
    reasonCode = "seniority_filtered_out";
  } else if (input.afterThreshold === 0) {
    reasonCode = "score_threshold_filtered_out";
  } else if (input.updated > 0 || input.reactivated > 0) {
    reasonCode = "all_refreshed";
  } else {
    reasonCode = Object.keys(input.sourceErrors).length > 0 ? "source_errors" : "no_source_results";
  }

  const secondaryIssues: DiscoveryRunReasonCode[] = [];
  if (Object.keys(input.sourceErrors).length > 0 && reasonCode !== "source_errors") {
    secondaryIssues.push("source_errors");
  }

  return { reasonCode, secondaryIssues };
};

const buildExistingOpportunityMap = (rows: Opportunity[]): Map<string, Opportunity> => {
  const map = new Map<string, Opportunity>();
  for (const row of rows) {
    if (!row.api_source || !row.api_job_id) continue;
    map.set(buildApiDedupeKey(row.api_source, row.api_job_id), row);
  }
  return map;
};

export async function runDiscoveryForUser(
  supabase: SupabaseClient,
  userId: string,
  options: RunDiscoveryOptions = {}
): Promise<RunDiscoveryResult> {
  if (!options.skipRateLimit) {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from("discovery_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("started_at", hourAgo);

    if (countErr) {
      throw new Error(countErr.message);
    }
    if ((count ?? 0) >= 3) {
      return {
        runId: "",
        newOpportunitiesCount: 0,
        resultsCount: 0,
        reviewedCount: 0,
        activeCount: 0,
        archivedCount: 0,
        updatedCount: 0,
        reactivatedCount: 0,
        sourceErrors: {},
        diagnostics: buildEmptyDiagnostics("any"),
        rateLimited: true,
      };
    }
  }

  const { data: prefRow, error: prefErr } = await supabase
    .from("discovery_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (prefErr) {
    throw new Error(prefErr.message);
  }

  const prefs = mergeDiscoveryPreferencesRow(prefRow as DiscoveryPreferencesRow | null);
  if (!prefs.is_active) {
    return {
      runId: "",
      newOpportunitiesCount: 0,
      resultsCount: 0,
      reviewedCount: 0,
      activeCount: 0,
      archivedCount: 0,
      updatedCount: 0,
      reactivatedCount: 0,
      sourceErrors: {},
      diagnostics: buildEmptyDiagnostics(normalizeRemotePreference(prefs.remote_preference)),
      inactive: true,
    };
  }

  const profileContext = await getDiscoveryProfileContext(supabase, userId);
  const resumeContextPreview = buildResumeContextPreview({
    profileContext,
    preferences: prefs,
  });
  const searchContext = buildDiscoverySearchContext({
    preferences: prefs,
    preview: resumeContextPreview,
  });
  const remotePreference = normalizeRemotePreference(prefs.remote_preference);
  const sourceQueryLocations = buildSourceQueryLocations(searchContext.locations, remotePreference);

  const querySnapshot = {
    keywords: searchContext.keywords,
    locations: searchContext.locations,
    source_query_locations: sourceQueryLocations,
    remote_preference: remotePreference,
    role_types: searchContext.roleTypes,
    greenhouse_slugs: prefs.greenhouse_slugs?.slice(0, 20),
    resume_context_enabled: prefs.resume_context_enabled,
    resume_context_customized: prefs.resume_context_customized,
    min_match_score: prefs.min_match_score,
    saved_context: {
      keywords: prefs.keywords,
      locations: prefs.locations,
      role_types: prefs.role_types,
      remote_preference: prefs.remote_preference,
    },
    detected_context: searchContext.detectedContext,
    effective_context: searchContext.effectiveContext,
    executed_context: {
      keywords: searchContext.keywords,
      locations: searchContext.locations,
      source_query_locations: sourceQueryLocations,
      role_types: searchContext.roleTypes,
      remote_preference: remotePreference,
    },
    adzuna_pages: 4,
  };

  const { data: runInsert, error: runErr } = await supabase
    .from("discovery_runs")
    .insert({
      user_id: userId,
      api_source: "aggregate",
      query_params: querySnapshot,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runErr || !runInsert?.id) {
    throw new Error(runErr?.message ?? "Failed to start discovery run");
  }

  const runId = runInsert.id as string;

  try {
    const discoveryJobsResult = await fetchAllDiscoveryJobs({
      keywords: searchContext.keywords,
      locations: searchContext.locations,
      sourceQueryLocations,
      remotePreference,
      roleTypes: searchContext.roleTypes,
      excludedCompanies: prefs.excluded_companies ?? [],
      greenhouseSlugs:
        (prefs.greenhouse_slugs ?? []).length > 0 ? prefs.greenhouse_slugs! : DEFAULT_GREENHOUSE_SLUGS,
      adzunaMaxPages: 4,
    });
    const { jobs, sourceErrors, sourceStats, sourceAvailability } = discoveryJobsResult;
    const executedSourceQueryLocations =
      discoveryJobsResult.sourceQueryLocations.length > 0
        ? discoveryJobsResult.sourceQueryLocations
        : sourceQueryLocations;
    const fetchStageCounts = discoveryJobsResult.stageCounts ?? {
      fetched: jobs.length,
      afterRemote: jobs.length,
      afterLocation: jobs.length,
      afterSeniority: jobs.length,
    };

    const discoveryKeywords = uniqueNonEmpty([
      ...profileContext.profileKeywords,
      ...searchContext.keywords,
      ...searchContext.roleTypes,
    ]);
    const minScore = prefs.min_match_score ?? 50;
    const runTimestamp = new Date().toISOString();

    const { data: existingRows, error: existingError } = await supabase
      .from("opportunities")
      .select("*")
      .eq("user_id", userId)
      .eq("source", "recommendation")
      .not("api_source", "is", null);

    if (existingError) {
      throw new Error(existingError.message);
    }

    const existingOpportunities = (existingRows ?? []) as Opportunity[];
    const existingByKey = buildExistingOpportunityMap(existingOpportunities);
    const finalActiveKeys = new Set(
      existingOpportunities
        .filter((row) => row.status === "new" && row.api_source && row.api_job_id)
        .map((row) => buildApiDedupeKey(row.api_source!, row.api_job_id!))
    );

    const shortlist = jobs
      .map((job) => {
        const normalizedLocation = job.location || (job.is_remote ? "Remote" : "");
        const insight = computeMatchInsight({
          jobDescription: [job.title, normalizedLocation, job.description].filter(Boolean).join(" "),
          resumeText: profileContext.resumeText,
          profileContextText: [profileContext.profileContextText, searchContext.note]
            .filter(Boolean)
            .join("\n\n"),
          profileKeywords: discoveryKeywords,
          jobTitle: job.title,
          roleTypes: searchContext.roleTypes,
          jobLocation: normalizedLocation,
          preferredLocations: searchContext.locations,
          remotePreference,
        });

        return {
          job,
          normalizedLocation,
          insight,
          apiKey: buildApiDedupeKey(job.api_source, job.api_job_id),
        };
      })
      .filter((item) => item.insight.score >= minScore);

    const afterThresholdCount = shortlist.length;
    const seenApiKeys = new Set(shortlist.map((item) => item.apiKey));

    let insertedCount = 0;
    let updatedCount = 0;
    let reactivatedCount = 0;
    let archivedCount = 0;
    let currentRunActiveCount = 0;

    for (const existing of existingOpportunities) {
      if (
        existing.status !== "new" ||
        existing.application_id ||
        !existing.api_source ||
        !existing.api_job_id
      ) {
        continue;
      }

      const apiKey = buildApiDedupeKey(existing.api_source, existing.api_job_id);
      if (seenApiKeys.has(apiKey)) continue;

      const nextMissedRuns = (existing.discovery_missed_runs ?? 0) + 1;
      const shouldArchive = nextMissedRuns >= STALE_DISCOVERY_MISS_LIMIT;
      const payload = shouldArchive
        ? {
            status: "archived",
            discovery_is_stale: true,
            discovery_missed_runs: nextMissedRuns,
            updated_at: runTimestamp,
          }
        : {
            discovery_is_stale: true,
            discovery_missed_runs: nextMissedRuns,
            updated_at: runTimestamp,
          };

      const { error: staleError } = await supabase
        .from("opportunities")
        .update(payload)
        .eq("id", existing.id)
        .eq("user_id", userId);

      if (staleError) {
        console.error("discovery stale update", staleError);
        continue;
      }

      if (shouldArchive) {
        archivedCount += 1;
        finalActiveKeys.delete(apiKey);
      } else {
        finalActiveKeys.add(apiKey);
      }
    }

    for (const item of shortlist) {
      const { job, normalizedLocation, insight, apiKey } = item;
      const existing = existingByKey.get(apiKey);
      const board = inferBoardFromUrl(job.job_url);
      const nextStatus =
        existing?.status === "saved" || existing?.status === "applied" ? existing.status : "new";
      const payload = {
        company: job.company,
        role: job.title,
        location: normalizedLocation,
        board,
        source: "recommendation" as const,
        job_url: job.job_url || "#",
        external_job_id: job.api_job_id,
        salary_range: job.salary,
        status: nextStatus,
        employment_type: job.is_remote ? "Remote" : "",
        job_description: job.description || "",
        match_score: insight.score,
        match_summary: insight.summary,
        matched_keywords: insight.matched_keywords,
        missing_keywords: insight.missing_keywords,
        application_id: existing?.application_id ?? null,
        api_source: job.api_source,
        api_job_id: job.api_job_id,
        discovery_run_id: runId,
        ai_score: existing?.ai_score ?? {},
        posted_at: job.posted_at,
        discovery_last_seen_at: runTimestamp,
        discovery_missed_runs: 0,
        discovery_is_stale: false,
        updated_at: runTimestamp,
      };

      if (existing) {
        if (existing.status === "archived" && nextStatus === "new") {
          reactivatedCount += 1;
        }

        const { error: updateError } = await supabase
          .from("opportunities")
          .update(payload)
          .eq("id", existing.id)
          .eq("user_id", userId);

        if (updateError) {
          console.error("discovery update", updateError);
          continue;
        }

        if (nextStatus === "new") {
          currentRunActiveCount += 1;
          finalActiveKeys.add(apiKey);
        } else {
          finalActiveKeys.delete(apiKey);
        }

        updatedCount += 1;
        continue;
      }

      const { error: insertError } = await supabase.from("opportunities").insert({
        user_id: userId,
        created_at: runTimestamp,
        ...payload,
      });

      if (insertError) {
        console.error("discovery insert", insertError);
        continue;
      }

      currentRunActiveCount += 1;
      finalActiveKeys.add(apiKey);
      insertedCount += 1;
    }

    const activeCount = finalActiveKeys.size;
    const outcome = classifyDiscoveryReasonCode({
      sourceErrors,
      fetched: fetchStageCounts.fetched,
      afterRemote: fetchStageCounts.afterRemote,
      afterLocation: fetchStageCounts.afterLocation,
      afterSeniority: fetchStageCounts.afterSeniority,
      afterThreshold: afterThresholdCount,
      active: currentRunActiveCount,
      updated: updatedCount,
      reactivated: reactivatedCount,
    });

    const diagnostics: DiscoveryRunDiagnostics = {
      reasonCode: outcome.reasonCode,
      secondaryIssues: outcome.secondaryIssues,
      effectiveContext: {
        locations: searchContext.effectiveContext.locations,
        remote_preference: remotePreference,
        role_types: searchContext.effectiveContext.role_types,
      },
      executedContext: {
        keywords: searchContext.keywords,
        locations: searchContext.locations,
        source_query_locations: executedSourceQueryLocations,
        role_types: searchContext.roleTypes,
        remote_preference: remotePreference,
      },
      stageCounts: {
        fetched: fetchStageCounts.fetched,
        afterRemote: fetchStageCounts.afterRemote,
        afterLocation: fetchStageCounts.afterLocation,
        afterSeniority: fetchStageCounts.afterSeniority,
        afterThreshold: afterThresholdCount,
        active: currentRunActiveCount,
        inserted: insertedCount,
        updated: updatedCount,
        reactivated: reactivatedCount,
      },
      sourceStats,
      sourceAvailability,
    };

    await supabase
      .from("discovery_runs")
      .update({
        results_count: jobs.length,
        new_opportunities_count: insertedCount,
        completed_at: new Date().toISOString(),
        error_message: Object.keys(sourceErrors).length > 0 ? JSON.stringify(sourceErrors) : null,
        query_params: {
          ...querySnapshot,
          source_query_locations: executedSourceQueryLocations,
          executed_context: diagnostics.executedContext,
          source_stats: sourceStats,
          source_availability: sourceAvailability,
        },
      })
      .eq("id", runId);

    await supabase
      .from("discovery_preferences")
      .update({
        last_discovery_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return {
      runId,
      newOpportunitiesCount: insertedCount,
      resultsCount: jobs.length,
      reviewedCount: jobs.length,
      activeCount,
      archivedCount,
      updatedCount,
      reactivatedCount,
      sourceErrors,
      diagnostics,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery failed";
    await supabase
      .from("discovery_runs")
      .update({
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", runId);
    throw error;
  }
}
