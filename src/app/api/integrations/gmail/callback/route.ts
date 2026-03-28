import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { isGmailAutomationEnabled } from "@/lib/features";

export const runtime = "nodejs";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GMAIL_PROFILE_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/profile";

export async function GET(request: Request) {
  if (!isGmailAutomationEnabled()) {
    return NextResponse.redirect(`${getSiteUrl()}/dashboard/automation?error=feature_disabled`);
  }
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  if (!user) return NextResponse.redirect(`${getSiteUrl()}/login`);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = cookies();
  const stateCookie = cookieStore.get("interniq_gmail_oauth_state")?.value;

  if (!code || !state || !stateCookie || stateCookie !== state) {
    return NextResponse.redirect(`${getSiteUrl()}/dashboard/automation?error=oauth_state_invalid`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${getSiteUrl()}/dashboard/automation?error=oauth_config_missing`);
  }

  const tokenBody = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${getSiteUrl()}/api/integrations/gmail/callback`,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });
  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${getSiteUrl()}/dashboard/automation?error=oauth_exchange_failed`);
  }
  const tokenPayload = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  const profileResponse = await fetch(GMAIL_PROFILE_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  if (!profileResponse.ok) {
    return NextResponse.redirect(`${getSiteUrl()}/dashboard/automation?error=gmail_profile_failed`);
  }
  const profile = (await profileResponse.json()) as { emailAddress: string };
  const expiresAt = new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString();

  const { error: upsertError } = await supabase.from("email_connections").upsert(
    {
      user_id: user.id,
      provider: "gmail",
      provider_account_email: profile.emailAddress.toLowerCase(),
      access_token: tokenPayload.access_token,
      refresh_token: tokenPayload.refresh_token ?? "",
      access_token_expires_at: expiresAt,
      is_active: true,
    },
    { onConflict: "user_id,provider" }
  );
  if (upsertError) {
    return NextResponse.redirect(`${getSiteUrl()}/dashboard/automation?error=connection_save_failed`);
  }

  const response = NextResponse.redirect(`${getSiteUrl()}/dashboard/automation?connected=1`);
  response.cookies.set("interniq_gmail_oauth_state", "", { maxAge: 0, path: "/" });
  return response;
}
