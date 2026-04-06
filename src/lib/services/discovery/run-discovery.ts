import { getResumeAndKeywords } from "@/lib/server/resume-keywords";
import { computeMatchInsight, inferBoardFromUrl } from "@/lib/services/career-os";
import { fetchAllDiscoveryJobs } from "@/lib/services/job-apis";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DiscoveryPreferencesRow = {
  keywords: string[] | null;
  locations: string[] | null;
  remote_preference: string | null;
  role_types: string[] | null;
  excluded_companies: string[] | null;
  greenhouse_slugs: string[] | null;
  min_match_score: number | null;
  is_active: boolean | null;
};

const defaultPreferences = (): DiscoveryPreferencesRow => ({
  keywords: [],
  locations: [],
  remote_preference: "any",
  role_types: ["intern", "entry-level", "junior"],
  excluded_companies: [],
  greenhouse_slugs: [],
  min_match_score: 50,
  is_active: true,
});

const mergePrefs = (row: DiscoveryPreferencesRow | null): DiscoveryPreferencesRow => {
  const d = defaultPreferences();
  if (!row) return d;
  return {
    keywords: row.keywords ?? d.keywords,
    locations: row.locations ?? d.locations,
    remote_preference: row.remote_preference ?? d.remote_preference,
    role_types: row.role_types ?? d.role_types,
    excluded_companies: row.excluded_companies ?? d.excluded_companies,
    greenhouse_slugs: row.greenhouse_slugs ?? d.greenhouse_slugs,
    min_match_score: row.min_match_score ?? d.min_match_score,
    is_active: row.is_active ?? d.is_active,
  };
};

export type RunDiscoveryOptions = {
  /** When true, skip the 3-runs-per-hour user limit (cron). */
  skipRateLimit?: boolean;
};

export type RunDiscoveryResult = {
  runId: string;
  newOpportunitiesCount: number;
  resultsCount: number;
  sourceErrors: Record<string, string>;
  inactive?: boolean;
  rateLimited?: boolean;
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
        sourceErrors: {},
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

  const prefs = mergePrefs(prefRow as DiscoveryPreferencesRow | null);
  if (!prefs.is_active) {
    return {
      runId: "",
      newOpportunitiesCount: 0,
      resultsCount: 0,
      sourceErrors: {},
      inactive: true,
    };
  }

  const querySnapshot = {
    keywords: prefs.keywords,
    locations: prefs.locations,
    remote_preference: prefs.remote_preference,
    role_types: prefs.role_types,
    greenhouse_slugs: prefs.greenhouse_slugs?.slice(0, 20),
    adzuna_pages: 2,
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
    const { jobs, sourceErrors } = await fetchAllDiscoveryJobs({
      keywords: prefs.keywords ?? [],
      locations: prefs.locations ?? [],
      remotePreference:
        prefs.remote_preference === "remote_only" ||
        prefs.remote_preference === "hybrid" ||
        prefs.remote_preference === "onsite" ||
        prefs.remote_preference === "any"
          ? prefs.remote_preference
          : "any",
      roleTypes: prefs.role_types ?? [],
      excludedCompanies: prefs.excluded_companies ?? [],
      greenhouseSlugs: prefs.greenhouse_slugs ?? [],
      adzunaMaxPages: 2,
    });

    const { resumeText, profileKeywords } = await getResumeAndKeywords(supabase, userId);

    const minScore = prefs.min_match_score ?? 50;
    let inserted = 0;

    for (const job of jobs) {
      const insight = computeMatchInsight({
        jobDescription: job.description || job.title,
        resumeText,
        profileKeywords,
      });

      if (insight.score < minScore) continue;

      const board = inferBoardFromUrl(job.job_url);
      const externalId = job.api_job_id;

      const row = {
        user_id: userId,
        company: job.company,
        role: job.title,
        location: job.location || (job.is_remote ? "Remote" : ""),
        board,
        source: "recommendation" as const,
        job_url: job.job_url || "#",
        external_job_id: externalId,
        salary_range: job.salary,
        status: "new" as const,
        employment_type: job.is_remote ? "Remote" : "",
        job_description: job.description || "",
        match_score: insight.score,
        match_summary: insight.summary,
        matched_keywords: insight.matched_keywords,
        missing_keywords: insight.missing_keywords,
        application_id: null,
        api_source: job.api_source,
        api_job_id: job.api_job_id,
        discovery_run_id: runId,
        ai_score: {},
        posted_at: job.posted_at,
      };

      const { error: insErr } = await supabase.from("opportunities").insert(row);
      if (insErr) {
        if (insErr.code === "23505") continue;
        if (insErr.message?.includes("duplicate") || insErr.code === "42P10") continue;
        console.error("discovery insert", insErr);
        continue;
      }
      inserted += 1;
    }

    await supabase
      .from("discovery_runs")
      .update({
        results_count: jobs.length,
        new_opportunities_count: inserted,
        completed_at: new Date().toISOString(),
        error_message:
          Object.keys(sourceErrors).length > 0 ? JSON.stringify(sourceErrors) : null,
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
      newOpportunitiesCount: inserted,
      resultsCount: jobs.length,
      sourceErrors,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Discovery failed";
    await supabase
      .from("discovery_runs")
      .update({
        completed_at: new Date().toISOString(),
        error_message: msg,
      })
      .eq("id", runId);
    throw e;
  }
}
