import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runDiscoveryForUser } from "@/lib/services/discovery/run-discovery";
import { isJobDiscoveryEnabled } from "@/lib/features";

export async function GET(request: Request) {
  if (!isJobDiscoveryEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Service role not configured." }, { status: 503 });
  }

  const { data: prefs, error: prefErr } = await admin
    .from("discovery_preferences")
    .select("user_id")
    .eq("is_active", true)
    .limit(10);

  if (prefErr) {
    return NextResponse.json({ error: prefErr.message }, { status: 500 });
  }

  let processed = 0;
  for (const row of prefs ?? []) {
    const uid = row.user_id as string;
    try {
      await runDiscoveryForUser(admin, uid, { skipRateLimit: true });
      processed += 1;
    } catch (e) {
      console.error("discovery cron user", uid, e);
    }
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  await admin
    .from("opportunities")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("status", "new")
    .eq("source", "recommendation")
    .not("api_source", "is", null)
    .not("posted_at", "is", null)
    .lt("posted_at", cutoff);

  await admin
    .from("opportunities")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("status", "new")
    .eq("source", "recommendation")
    .not("api_source", "is", null)
    .is("posted_at", null)
    .lt("created_at", cutoff);

  return NextResponse.json({ processed, users: prefs?.length ?? 0 });
}
