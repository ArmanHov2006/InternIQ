import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveApplicationStatus } from "@/lib/constants";

type Body = {
  applicationId?: string;
};

const parseSuggestedStatus = (evidence: unknown) => {
  if (typeof evidence !== "string") return null;
  if (!evidence.startsWith("suggested:")) return null;
  const [head] = evidence.split("|");
  const raw = head.replace("suggested:", "");
  return resolveApplicationStatus(raw);
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
    .select("id, user_id, status, status_evidence, status_confidence")
    .eq("id", body.applicationId)
    .eq("user_id", user.id)
    .single();

  if (appError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const suggestedStatus = parseSuggestedStatus(application.status_evidence);
  if (!suggestedStatus) {
    return NextResponse.json({ error: "No valid suggestion found." }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("applications")
    .update({
      previous_status: application.status,
      status: suggestedStatus,
      status_source: "email_auto",
      suggestion_pending: false,
      auto_updated_at: new Date().toISOString(),
      status_evidence: application.status_evidence,
    })
    .eq("id", body.applicationId)
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
    next_status: suggestedStatus,
    source: "email_auto",
    confidence: application.status_confidence ?? 0.6,
    evidence: application.status_evidence ?? "Applied email suggestion",
    metadata: { mode: "apply_suggestion" },
  });

  return NextResponse.json(updated);
}
