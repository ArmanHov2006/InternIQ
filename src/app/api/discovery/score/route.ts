import { NextResponse } from "next/server";
import { isSupabaseConfigured, withAuth } from "@/lib/server/route-utils";
import { isJobDiscoveryEnabled } from "@/lib/features";
import { checkAiRateLimit } from "@/lib/rate-limit";
import { getResumeAndKeywords } from "@/lib/server/resume-keywords";
import { scoreJobSnippetsWithClaude } from "@/lib/services/discovery/ai-scorer";
import type { Opportunity } from "@/types/database";

export async function POST(request: Request) {
  if (!isJobDiscoveryEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const limited = await checkAiRateLimit(request, user.id);
  if (limited) return limited;

  let body: Record<string, unknown> = {};
  try {
    const raw = await request.json();
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      body = raw as Record<string, unknown>;
    }
  } catch {
    /* empty body */
  }

  const explicitIds = Array.isArray(body.opportunity_ids)
    ? (body.opportunity_ids as unknown[]).map(String).filter(Boolean)
    : null;

  const { data: rows, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("user_id", user.id)
    .gte("match_score", 60)
    .not("api_source", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let candidates = (rows ?? []) as Opportunity[];
  candidates = candidates.filter((row) => {
    const a = row.ai_score;
    return a == null || (typeof a === "object" && Object.keys(a as object).length === 0);
  });

  if (explicitIds?.length) {
    const set = new Set(explicitIds);
    candidates = candidates.filter((c) => set.has(c.id));
  }

  candidates = candidates.slice(0, 15);
  if (candidates.length === 0) {
    return NextResponse.json({ scored: 0, message: "No eligible jobs." });
  }

  const { resumeText, profileKeywords, profileContextText } = await getResumeAndKeywords(
    supabase,
    user.id
  );

  let scored = 0;
  const chunkSize = 5;

  for (let i = 0; i < candidates.length; i += chunkSize) {
    const chunk = candidates.slice(i, i + chunkSize);
    const snippets = chunk.map((c) => ({
      id: c.id,
      title: c.role,
      company: c.company,
      descriptionSnippet: (c.job_description || "").slice(0, 500),
    }));

    const scores = await scoreJobSnippetsWithClaude({
      resumeText: profileContextText || resumeText,
      profileSkills: profileKeywords,
      jobs: snippets,
    });

    for (const opp of chunk) {
      const s = scores.get(opp.id);
      if (!s) continue;
      const { error: upErr } = await supabase
        .from("opportunities")
        .update({
          ai_score: s as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opp.id)
        .eq("user_id", user.id);
      if (!upErr) scored += 1;
    }
  }

  return NextResponse.json({ scored });
}
