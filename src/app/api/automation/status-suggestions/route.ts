import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/types/database";

export const runtime = "nodejs";

const withAuth = async () => {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return { response: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { supabase, user };
};

export async function GET() {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("application_status_suggestions")
    .select(
      "id, application_id, email_event_id, from_status, to_status, confidence, reason, status, created_at, email_events(from_email,subject,snippet,received_at)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const body = (await request.json().catch(() => null)) as
    | { id?: string; action?: "accept" | "reject" }
    | null;
  if (!body?.id || !body.action) {
    return NextResponse.json({ error: "Missing id/action" }, { status: 400 });
  }

  const { data: suggestion, error: fetchError } = await supabase
    .from("application_status_suggestions")
    .select("*")
    .eq("id", body.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  if (suggestion.status !== "pending") {
    return NextResponse.json({ error: "Suggestion already resolved" }, { status: 400 });
  }

  if (body.action === "accept") {
    const { error: appUpdateError } = await supabase
      .from("applications")
      .update({
        status: suggestion.to_status,
        last_status_change_source: "gmail_confirmed",
        last_status_change_reason: suggestion.reason,
        last_status_change_at: new Date().toISOString(),
      })
      .eq("id", suggestion.application_id)
      .eq("user_id", user.id);
    if (appUpdateError) return NextResponse.json({ error: appUpdateError.message }, { status: 500 });
  }

  const { data, error: updateError } = await supabase
    .from("application_status_suggestions")
    .update({
      status: body.action === "accept" ? "accepted" : "rejected",
      acted_at: new Date().toISOString(),
      acted_by_source: "user",
    })
    .eq("id", suggestion.id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", suggestion.application_id)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    suggestion: data,
    application: (application ?? null) as Application | null,
  });
}
