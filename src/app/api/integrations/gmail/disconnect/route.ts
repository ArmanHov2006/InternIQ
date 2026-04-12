import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGmailAutomationEnabled } from "@/lib/features";

export const runtime = "nodejs";

export async function POST() {
  if (!isGmailAutomationEnabled()) {
    return NextResponse.json({ error: "Gmail automation is disabled." }, { status: 403 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("email_connections")
    .update({
      is_active: false,
      access_token: "",
      refresh_token: "",
      access_token_expires_at: null,
      watch_expiration: null,
    })
    .eq("user_id", user.id)
    .eq("provider", "gmail");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
