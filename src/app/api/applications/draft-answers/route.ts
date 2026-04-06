import { NextResponse } from "next/server";
import { withAuth, isSupabaseConfigured } from "@/lib/server/route-utils";

export async function GET(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(null);
  }

  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const applicationId = new URL(request.url).searchParams.get("application_id");
  if (!applicationId?.trim()) {
    return NextResponse.json({ error: "application_id is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("application_artifacts")
    .select("content, title, created_at")
    .eq("user_id", user.id)
    .eq("application_id", applicationId.trim())
    .eq("artifact_type", "draft_answers")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}
