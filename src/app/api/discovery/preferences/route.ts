import { NextResponse } from "next/server";
import type { DiscoveryPreferences, RemotePreference } from "@/types/database";
import { ensureObjectBody, isSupabaseConfigured, withAuth } from "@/lib/server/route-utils";
import { isJobDiscoveryEnabled } from "@/lib/features";

const REMOTE: RemotePreference[] = ["any", "remote_only", "hybrid", "onsite"];

const parseStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.map((v) => String(v).trim()).filter(Boolean);
};

const toResponse = (
  userId: string,
  row: Record<string, unknown> | null
): DiscoveryPreferences => {
  const remote = row?.remote_preference;
  const rp: RemotePreference =
    typeof remote === "string" && (REMOTE as string[]).includes(remote)
      ? (remote as RemotePreference)
      : "any";

  return {
    user_id: userId,
    keywords: Array.isArray(row?.keywords) ? (row!.keywords as string[]) : [],
    locations: Array.isArray(row?.locations) ? (row!.locations as string[]) : [],
    remote_preference: rp,
    role_types: Array.isArray(row?.role_types) ? (row!.role_types as string[]) : [],
    excluded_companies: Array.isArray(row?.excluded_companies)
      ? (row!.excluded_companies as string[])
      : [],
    greenhouse_slugs: Array.isArray(row?.greenhouse_slugs)
      ? (row!.greenhouse_slugs as string[])
      : [],
    min_match_score:
      typeof row?.min_match_score === "number" && row.min_match_score >= 0 && row.min_match_score <= 100
        ? row.min_match_score
        : 45,
    is_active: typeof row?.is_active === "boolean" ? row.is_active : true,
    last_discovery_at: typeof row?.last_discovery_at === "string" ? row.last_discovery_at : null,
    created_at: typeof row?.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at: typeof row?.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
};

export async function GET() {
  if (!isJobDiscoveryEnabled()) {
    return NextResponse.json({ error: "Job discovery is disabled." }, { status: 404 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      toResponse("demo-user", null)
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

  return NextResponse.json(toResponse(user.id, data as Record<string, unknown> | null));
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

  const keywords = parseStringArray(body.keywords);
  const locations = parseStringArray(body.locations);
  const roleTypes = parseStringArray(body.role_types);
  const excludedCompanies = parseStringArray(body.excluded_companies);
  const greenhouseSlugs = parseStringArray(body.greenhouse_slugs);

  const remoteRaw = typeof body.remote_preference === "string" ? body.remote_preference : "any";
  const remote_preference = (REMOTE as string[]).includes(remoteRaw)
    ? (remoteRaw as RemotePreference)
    : "any";

  let min_match_score = 45;
  if (typeof body.min_match_score === "number") {
    min_match_score = Math.max(0, Math.min(100, Math.round(body.min_match_score)));
  }

  const is_active = typeof body.is_active === "boolean" ? body.is_active : true;

  const payload = {
    user_id: user.id,
    keywords: keywords ?? [],
    locations: locations ?? [],
    remote_preference,
    role_types: roleTypes ?? [],
    excluded_companies: excludedCompanies ?? [],
    greenhouse_slugs: (greenhouseSlugs ?? []).map((s) => s.toLowerCase().replace(/\s+/g, "-")),
    min_match_score,
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

  return NextResponse.json(toResponse(user.id, data as Record<string, unknown>));
}
