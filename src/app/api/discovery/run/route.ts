import { NextResponse } from "next/server";
import { isSupabaseConfigured, withAuth } from "@/lib/server/route-utils";
import { isJobDiscoveryEnabled } from "@/lib/features";
import { runDiscoveryForUser } from "@/lib/services/discovery/run-discovery";

export async function POST() {
  if (!isJobDiscoveryEnabled()) {
    return NextResponse.json({ error: "Job discovery is disabled." }, { status: 404 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        runId: "",
        newOpportunitiesCount: 0,
        resultsCount: 0,
        sourceErrors: {},
        demo: true,
        message: "Discovery requires Supabase.",
      },
      { status: 503 }
    );
  }

  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  try {
    const result = await runDiscoveryForUser(supabase, user.id, { skipRateLimit: false });

    if (result.rateLimited) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can run discovery at most 3 times per hour." },
        { status: 429 }
      );
    }

    if (result.inactive) {
      return NextResponse.json(
        { error: "Discovery is paused. Enable it in preferences." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      runId: result.runId,
      reviewedCount: result.reviewedCount,
      activeCount: result.activeCount,
      archivedCount: result.archivedCount,
      updatedCount: result.updatedCount,
      reactivatedCount: result.reactivatedCount,
      newOpportunitiesCount: result.newOpportunitiesCount,
      resultsCount: result.resultsCount,
      sourceErrors: result.sourceErrors,
      diagnostics: result.diagnostics,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Discovery failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
