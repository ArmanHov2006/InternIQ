import { NextResponse } from "next/server";
import { isSupabaseConfigured, withAuth } from "@/lib/server/route-utils";
import { isJobDiscoveryEnabled } from "@/lib/features";
import { checkAiRateLimit } from "@/lib/rate-limit";
import { scoreDiscoveryShortlistForUser } from "@/lib/services/discovery/score-discovery";

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
  const runId = typeof body.runId === "string" && body.runId.trim() ? body.runId.trim() : undefined;
  const requestedLimit =
    typeof body.limit === "number" && Number.isFinite(body.limit)
      ? Math.max(1, Math.min(20, Math.round(body.limit)))
      : 10;

  try {
    const result = await scoreDiscoveryShortlistForUser(supabase, user.id, {
      runId,
      opportunityIds: explicitIds ?? undefined,
      limit: requestedLimit,
    });

    if (result.candidates === 0) {
      return NextResponse.json({
        scored: 0,
        candidates: 0,
        remaining: 0,
        done: true,
        message: "No eligible jobs.",
        runId: result.runId,
      });
    }

    return NextResponse.json({
      scored: result.scored,
      candidates: result.candidates,
      remaining: result.remaining,
      done: result.done,
      runId: result.runId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
