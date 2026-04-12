import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchHistoryMessageIds,
  parsePubSubWebhookBody,
} from "@/lib/services/email-ingestion/gmail-client";
import { processInboundGmailMessage } from "@/lib/services/email-ingestion/processor";
import type { EmailConnectionRecord } from "@/lib/services/email-ingestion/types";
import { isGmailAutomationEnabled } from "@/lib/features";

export const runtime = "nodejs";

const getSecretFromHeaders = (headers: Headers): string =>
  headers.get("x-interniq-webhook-secret") || headers.get("x-webhook-secret") || "";

const MAX_SKEW_SECONDS = 300;

const safeEqual = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const verifySignedWebhook = (request: Request, rawBody: string, secret: string): boolean => {
  const ts = request.headers.get("x-interniq-webhook-ts") || "";
  const sig = request.headers.get("x-interniq-webhook-signature") || "";
  if (!ts || !sig) return false;

  const parsedTs = Number(ts);
  if (!Number.isFinite(parsedTs)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsedTs) > MAX_SKEW_SECONDS) return false;

  const digest = crypto.createHmac("sha256", secret).update(`${ts}.${rawBody}`).digest("hex");
  return safeEqual(digest, sig);
};

export async function POST(request: Request) {
  if (!isGmailAutomationEnabled()) {
    return NextResponse.json({ ok: true, ignored: true, reason: "Feature disabled." });
  }
  const expectedSecret = process.env.GMAIL_WEBHOOK_SECRET;
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  const providedSecret = getSecretFromHeaders(request.headers);
  const signedValid = expectedSecret ? verifySignedWebhook(request, rawBody, expectedSecret) : false;
  const secretValid = expectedSecret ? safeEqual(providedSecret, expectedSecret) : false;
  if (!expectedSecret || (!signedValid && !secretValid)) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const parsed = parsePubSubWebhookBody(body);
  if (!parsed) {
    console.warn("gmail_webhook_malformed_body", { bodyKeys: body && typeof body === "object" ? Object.keys(body) : [] });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createAdminClient();
  const { data: connection, error: connectionError } = await admin
    .from("email_connections")
    .select("*")
    .eq("provider", "gmail")
    .eq("provider_account_email", parsed.emailAddress)
    .eq("is_active", true)
    .maybeSingle();
  if (connectionError) {
    return NextResponse.json({ error: connectionError.message }, { status: 500 });
  }
  if (!connection) {
    return NextResponse.json({ ok: true, ignored: true, reason: "No active connection." });
  }

  try {
    const messageIds = await fetchHistoryMessageIds(
      connection as unknown as EmailConnectionRecord,
      parsed.historyId,
      admin
    );
    let applied = 0;
    let suggested = 0;
    let ignored = 0;
    let deadLetter = 0;
    for (const messageId of messageIds) {
      try {
        const result = await processInboundGmailMessage(
          connection as unknown as EmailConnectionRecord,
          messageId,
          parsed.historyId,
          admin
        );
        if (result.processingStatus === "applied") applied += 1;
        else if (result.processingStatus === "suggested") suggested += 1;
        else if (result.processingStatus === "ignored") ignored += 1;
        else deadLetter += 1;
      } catch (error) {
        deadLetter += 1;
        console.error("gmail_webhook_message_failed", {
          messageId,
          historyId: parsed.historyId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.info("gmail_webhook_batch_processed", {
      connectionId: connection.id,
      emailAddress: parsed.emailAddress,
      historyId: parsed.historyId,
      processed: messageIds.length,
      applied,
      suggested,
      ignored,
      deadLetter,
    });

    return NextResponse.json({
      ok: true,
      processed: messageIds.length,
      applied,
      suggested,
      ignored,
      deadLetter,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 500 }
    );
  }
}
