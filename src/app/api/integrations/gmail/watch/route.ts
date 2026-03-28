import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { startGmailWatch } from "@/lib/services/email-ingestion/gmail-client";
import type { EmailConnectionRecord } from "@/lib/services/email-ingestion/types";
import { isGmailAutomationEnabled } from "@/lib/features";

export const runtime = "nodejs";

export async function POST() {
  if (!isGmailAutomationEnabled()) {
    return NextResponse.json({ error: "Gmail automation is disabled." }, { status: 403 });
  }
  const topicName = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topicName) {
    return NextResponse.json({ error: "Missing GMAIL_PUBSUB_TOPIC." }, { status: 500 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("email_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .eq("is_active", true)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No active Gmail connection." }, { status: 404 });

  try {
    const admin = createAdminClient();
    await startGmailWatch(data as unknown as EmailConnectionRecord, topicName, admin);
    return NextResponse.json({ success: true });
  } catch (watchError) {
    return NextResponse.json(
      { error: watchError instanceof Error ? watchError.message : "Could not start watch." },
      { status: 500 }
    );
  }
}
