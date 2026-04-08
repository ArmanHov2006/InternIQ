import type { SupabaseClient } from "@supabase/supabase-js";
import { getResumeAndKeywords } from "@/lib/server/resume-keywords";
import {
  parseStoredAi,
  scoreJobSnippetsWithClaude,
  type DiscoveryAiScore,
  type DiscoveryGatingFlag,
} from "@/lib/services/discovery/ai-scorer";
import type { Opportunity } from "@/types/database";

type ScoreDiscoveryOptions = {
  runId?: string;
  opportunityIds?: string[];
  limit?: number;
};

type ScoreDiscoveryResult = {
  runId: string | null;
  scored: number;
  candidates: number;
  remaining: number;
  done: boolean;
};

const SENIORITY_TITLE_REGEX = /\b(senior|sr\.?|staff|lead|principal|director|head|manager|chief|vp)\b/i;

const cleanDescriptionSnippet = (value: string): string =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1600);

const inferDiscoveryGatingFlags = (opportunity: Opportunity): DiscoveryGatingFlag[] => {
  const summary = (opportunity.match_summary ?? "").toLowerCase();
  const flags = new Set<DiscoveryGatingFlag>();

  if (summary.includes("must-have gap") || (opportunity.missing_keywords?.length ?? 0) >= 4) {
    flags.add("missing_must_have");
  }
  if (
    summary.includes("senior-level role") ||
    summary.includes("director-level role") ||
    SENIORITY_TITLE_REGEX.test(opportunity.role)
  ) {
    flags.add("seniority_mismatch");
  }
  if (summary.includes("years of experience")) {
    flags.add("years_mismatch");
  }
  if (summary.includes("location does not match")) {
    flags.add("location_mismatch");
  }
  if (summary.includes("not clearly remote") || summary.includes("primarily remote")) {
    flags.add("remote_mismatch");
  }

  return Array.from(flags);
};

const resolveRunId = async (
  supabase: SupabaseClient,
  userId: string,
  runId?: string
): Promise<string | null> => {
  if (runId?.trim()) return runId.trim();

  const { data, error } = await supabase
    .from("discovery_runs")
    .select("id")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const latest = Array.isArray(data) ? data[0] : null;
  return latest && typeof latest.id === "string" ? latest.id : null;
};

const shouldScoreOpportunity = (
  opportunity: Opportunity,
  resolvedRunId: string,
  explicitIds?: Set<string>
): boolean => {
  if (explicitIds && explicitIds.size > 0) {
    return explicitIds.has(opportunity.id);
  }
  const ai = parseStoredAi(opportunity);
  return !ai || ai.run_id !== resolvedRunId;
};

export async function scoreDiscoveryShortlistForUser(
  supabase: SupabaseClient,
  userId: string,
  options: ScoreDiscoveryOptions = {}
): Promise<ScoreDiscoveryResult> {
  const resolvedRunId = await resolveRunId(supabase, userId, options.runId);
  if (!resolvedRunId) {
    return { runId: null, scored: 0, candidates: 0, remaining: 0, done: true };
  }

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("user_id", userId)
    .eq("source", "recommendation")
    .eq("status", "new")
    .eq("discovery_run_id", resolvedRunId)
    .not("api_source", "is", null)
    .order("discovery_is_stale", { ascending: true, nullsFirst: true })
    .order("match_score", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const explicitIds =
    Array.isArray(options.opportunityIds) && options.opportunityIds.length > 0
      ? new Set(options.opportunityIds)
      : undefined;

  const eligible = ((data ?? []) as Opportunity[]).filter((opportunity) =>
    shouldScoreOpportunity(opportunity, resolvedRunId, explicitIds)
  );

  const limit = Math.max(1, Math.min(options.limit ?? 10, 20));
  const candidates = eligible.length;
  const batch = eligible.slice(0, limit);
  const remaining = Math.max(0, candidates - batch.length);

  if (batch.length === 0) {
    await supabase
      .from("discovery_runs")
      .update({ ai_scored_count: 0 })
      .eq("id", resolvedRunId)
      .eq("user_id", userId);
    return { runId: resolvedRunId, scored: 0, candidates: 0, remaining: 0, done: true };
  }

  const { resumeText, profileKeywords, profileContextText } = await getResumeAndKeywords(
    supabase,
    userId
  );

  let scored = 0;
  const chunkSize = 5;

  for (let index = 0; index < batch.length; index += chunkSize) {
    const chunk = batch.slice(index, index + chunkSize);
    const snippets = chunk.map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.role,
      company: opportunity.company,
      location: opportunity.location ?? "",
      heuristicScore: opportunity.match_score,
      matchedKeywords: opportunity.matched_keywords ?? [],
      missingKeywords: opportunity.missing_keywords ?? [],
      gatingFlags: inferDiscoveryGatingFlags(opportunity),
      descriptionSnippet: cleanDescriptionSnippet(opportunity.job_description || ""),
    }));

    const scores = await scoreJobSnippetsWithClaude({
      resumeText: profileContextText || resumeText,
      profileContextText,
      profileSkills: profileKeywords,
      jobs: snippets,
    });

    for (const opportunity of chunk) {
      const nextScore = scores.get(opportunity.id);
      if (!nextScore) continue;

      const payload: DiscoveryAiScore = {
        ...nextScore,
        run_id: resolvedRunId,
      };

      const { error: updateError } = await supabase
        .from("opportunities")
        .update({
          ai_score: payload as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunity.id)
        .eq("user_id", userId);

      if (!updateError) {
        scored += 1;
      }
    }
  }

  await supabase
    .from("discovery_runs")
    .update({ ai_scored_count: scored })
    .eq("id", resolvedRunId)
    .eq("user_id", userId);

  return {
    runId: resolvedRunId,
    scored,
    candidates,
    remaining,
    done: remaining === 0,
  };
}

export type { DiscoveryAiScore };
