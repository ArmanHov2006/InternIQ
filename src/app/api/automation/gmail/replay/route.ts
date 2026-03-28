import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processInboundGmailMessage } from "@/lib/services/email-ingestion/processor";
import type { EmailConnectionRecord } from "@/lib/services/email-ingestion/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { eventId?: string } | null;
  if (!body?.eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: event, error: eventError } = await admin
    .from("email_events")
    .select("*")
    .eq("id", body.eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: connection, error: connectionError } = await admin
    .from("email_connections")
    .select("*")
    .eq("id", event.connection_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (connectionError) return NextResponse.json({ error: connectionError.message }, { status: 500 });
  if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  const { error: incrementError } = await admin
    .from("email_events")
    .update({
      processing_attempts: Number(event.processing_attempts ?? 0) + 1,
      processing_status: "pending",
      last_error: "",
    })
    .eq("id", event.id);
  if (incrementError) return NextResponse.json({ error: incrementError.message }, { status: 500 });

  try {
    const result = await processInboundGmailMessage(
      connection as unknown as EmailConnectionRecord,
      String(event.provider_message_id),
      event.provider_history_id ? String(event.provider_history_id) : null,
      admin,
      { allowExistingEventId: String(event.id) }
    );
    return NextResponse.json({ success: true, result });
  } catch (error) {
    await admin
      .from("email_events")
      .update({
        processing_status: "dead_letter",
        last_error: error instanceof Error ? error.message : "Replay failed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Replay failed" },
      { status: 500 }
    );
  }
}
