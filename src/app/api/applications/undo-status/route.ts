import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveApplicationStatus } from "@/lib/constants";

type Body = {
  applicationId?: string;
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.applicationId) {
    return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
  }

  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("id, user_id, status, previous_status, suggestion_pending")
    .eq("id", body.applicationId)
    .eq("user_id", user.id)
    .single();

  if (appError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const previousStatus = resolveApplicationStatus(application.previous_status);
  if (!previousStatus) {
    if (application.suggestion_pending) {
      const { data: dismissed, error: dismissError } = await supabase
        .from("applications")
        .update({
          status_source: "manual",
          suggestion_pending: false,
          status_evidence: "Suggestion dismissed",
          status_confidence: 1,
        })
        .eq("id", application.id)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (dismissError) {
        return NextResponse.json({ error: dismissError.message }, { status: 500 });
      }
      return NextResponse.json(dismissed);
    }
    return NextResponse.json(
      { error: "No previous status available for undo." },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("applications")
    .update({
      status: previousStatus,
      status_source: "manual",
      status_confidence: 1,
      status_evidence: "Undone by user",
      suggestion_pending: false,
      auto_updated_at: null,
    })
    .eq("id", application.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("application_status_events").insert({
    application_id: application.id,
    user_id: user.id,
    previous_status: application.status,
    next_status: previousStatus,
    source: "undo",
    confidence: 1,
    evidence: "User triggered undo",
    metadata: {},
  });

  return NextResponse.json(updated);
}
