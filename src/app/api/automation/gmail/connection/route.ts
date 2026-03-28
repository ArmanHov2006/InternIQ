import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGmailAutomationEnabled } from "@/lib/features";

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
  if (!isGmailAutomationEnabled()) {
    return NextResponse.json({ connection: null, featureDisabled: true });
  }
  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("email_connections")
    .select("id, provider, provider_account_email, automation_mode, auto_update_threshold, is_active, watch_expiration, updated_at")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: data ?? null });
}

export async function PATCH(request: Request) {
  if (!isGmailAutomationEnabled()) {
    return NextResponse.json({ error: "Gmail automation is disabled." }, { status: 403 });
  }
  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const body = (await request.json().catch(() => null)) as
    | { automation_mode?: "suggestions_only" | "hybrid" | "fully_auto"; auto_update_threshold?: number }
    | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.automation_mode) {
    const allowed = ["suggestions_only", "hybrid", "fully_auto"];
    if (!allowed.includes(body.automation_mode)) {
      return NextResponse.json({ error: "Invalid automation mode" }, { status: 400 });
    }
    updates.automation_mode = body.automation_mode;
  }
  if (typeof body.auto_update_threshold === "number") {
    if (body.auto_update_threshold < 0 || body.auto_update_threshold > 1) {
      return NextResponse.json({ error: "Threshold must be between 0 and 1" }, { status: 400 });
    }
    updates.auto_update_threshold = body.auto_update_threshold;
  }
  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("email_connections")
    .update(updates)
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .select("id, provider, provider_account_email, automation_mode, auto_update_threshold, is_active, watch_expiration, updated_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Gmail connection not found" }, { status: 404 });
  return NextResponse.json({ connection: data });
}
