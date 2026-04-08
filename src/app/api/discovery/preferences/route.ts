import { NextResponse } from "next/server";
import { ensureObjectBody, isSupabaseConfigured, withAuth } from "@/lib/server/route-utils";
import { isJobDiscoveryEnabled } from "@/lib/features";
import { getDiscoveryProfileContext } from "@/lib/server/resume-keywords";
import {
  buildDiscoveryPreferencesResponse,
  type DiscoveryPreferencesRow,
  defaultDiscoveryPreferencesRow,
  mergeDiscoveryPreferencesRow,
  parseDiscoveryPreferencesBody,
} from "@/lib/services/discovery/resume-context";

export async function GET() {
  if (!isJobDiscoveryEnabled()) {
    return NextResponse.json({ error: "Job discovery is disabled." }, { status: 404 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      buildDiscoveryPreferencesResponse({
        userId: "demo-user",
        row: defaultDiscoveryPreferencesRow(),
        profileContext: null,
      })
    );
  }

  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("discovery_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profileContext = await getDiscoveryProfileContext(supabase, user.id);
  return NextResponse.json(
    buildDiscoveryPreferencesResponse({
      userId: user.id,
      row: mergeDiscoveryPreferencesRow(data as DiscoveryPreferencesRow | null),
      profileContext,
    })
  );
}

export async function PUT(request: Request) {
  if (!isJobDiscoveryEnabled()) {
    return NextResponse.json({ error: "Job discovery is disabled." }, { status: 404 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const body = await ensureObjectBody(request);
  if (body instanceof NextResponse) return body;

  const parsed = parseDiscoveryPreferencesBody(body);
  const remoteRaw = typeof body.remote_preference === "string" ? body.remote_preference : "any";
  const remote_preference =
    remoteRaw === "remote_only" || remoteRaw === "hybrid" || remoteRaw === "onsite" || remoteRaw === "any"
      ? remoteRaw
      : "any";

  let min_match_score = 50;
  if (typeof body.min_match_score === "number") {
    min_match_score = Math.max(0, Math.min(100, Math.round(body.min_match_score)));
  }

  const is_active = typeof body.is_active === "boolean" ? body.is_active : true;

  const payload = {
    user_id: user.id,
    keywords: parsed.keywords ?? [],
    locations: parsed.locations ?? [],
    remote_preference,
    role_types: parsed.role_types ?? [],
    excluded_companies: parsed.excluded_companies ?? [],
    greenhouse_slugs: parsed.greenhouse_slugs ?? [],
    min_match_score,
    resume_context_enabled: parsed.resume_context_enabled ?? true,
    resume_context_customized: parsed.resume_context_customized ?? false,
    resume_context_overrides:
      parsed.resume_context_customized === false
        ? {
            skills: [],
            locations: [],
            role_types: [],
            note: "",
          }
        : parsed.resume_context_overrides ?? {
            skills: [],
            locations: [],
            role_types: [],
            note: "",
          },
    is_active,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("discovery_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profileContext = await getDiscoveryProfileContext(supabase, user.id);
  return NextResponse.json(
    buildDiscoveryPreferencesResponse({
      userId: user.id,
      row: mergeDiscoveryPreferencesRow(data as DiscoveryPreferencesRow),
      profileContext,
    })
  );
}
