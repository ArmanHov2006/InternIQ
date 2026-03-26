import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/types/database";
import {
  classifyEmailStatus,
  confidenceMode,
  type EmailIngestMessage,
  pickBestApplicationMatch,
  safePrevStatus,
} from "@/lib/tracker-status-automation";

const APPLICATION_COLUMNS = [
  "id",
  "user_id",
  "company",
  "role",
  "job_url",
  "status",
  "applied_date",
  "salary_range",
  "location",
  "notes",
  "fit_score",
  "fit_analysis",
  "contact_name",
  "contact_email",
  "generated_email",
  "display_order",
  "status_source",
  "status_confidence",
  "status_evidence",
  "previous_status",
  "auto_updated_at",
  "suggestion_pending",
  "created_at",
  "updated_at",
].join(", ");

type Payload = {
  messages: EmailIngestMessage[];
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(payload?.messages) || payload.messages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_COLUMNS)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const applications = (data ?? []) as unknown as Application[];
  const results: Array<Record<string, unknown>> = [];

  for (const message of payload.messages) {
    const classification = classifyEmailStatus(message);
    if (!classification) {
      results.push({
        action: "ignored",
        reason: "No stage signal found",
        sender: message.sender,
        subject: message.subject,
      });
      continue;
    }

    const match = pickBestApplicationMatch(applications, message);
    if (!match) {
      results.push({
        action: "ignored",
        reason: "No confident application match",
        sender: message.sender,
        subject: message.subject,
        predictedStatus: classification.status,
      });
      continue;
    }

    const previousStatus = safePrevStatus(match.application.status);
    const mode = confidenceMode(classification.confidence);

    if (mode === "ignore") {
      results.push({
        action: "ignored",
        reason: "Low confidence classification",
        applicationId: match.application.id,
        confidence: classification.confidence,
      });
      continue;
    }

    if (mode === "suggested") {
      const { error: suggestionError } = await supabase
        .from("applications")
        .update({
          status_source: "email_suggested",
          status_confidence: classification.confidence,
          status_evidence: `suggested:${classification.status}|${classification.evidence}`,
          suggestion_pending: true,
          previous_status: previousStatus,
        })
        .eq("id", match.application.id)
        .eq("user_id", user.id);

      if (suggestionError) {
        return NextResponse.json({ error: suggestionError.message }, { status: 500 });
      }

      await supabase.from("application_status_events").insert({
        application_id: match.application.id,
        user_id: user.id,
        previous_status: previousStatus,
        next_status: classification.status,
        source: "email_suggested",
        confidence: classification.confidence,
        evidence: classification.evidence,
        metadata: {
          sender: message.sender,
          subject: message.subject,
          mode: "suggested",
        },
      });

      results.push({
        action: "suggested",
        applicationId: match.application.id,
        previousStatus,
        suggestedStatus: classification.status,
        confidence: classification.confidence,
      });
      continue;
    }

    const { data: updated, error: updateError } = await supabase
      .from("applications")
      .update({
        status: classification.status,
        previous_status: previousStatus,
        status_source: "email_auto",
        status_confidence: classification.confidence,
        status_evidence: classification.evidence,
        auto_updated_at: new Date().toISOString(),
        suggestion_pending: false,
      })
      .eq("id", match.application.id)
      .eq("user_id", user.id)
      .select(APPLICATION_COLUMNS)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from("application_status_events").insert({
      application_id: match.application.id,
      user_id: user.id,
      previous_status: previousStatus,
      next_status: classification.status,
      source: "email_auto",
      confidence: classification.confidence,
      evidence: classification.evidence,
      metadata: {
        sender: message.sender,
        subject: message.subject,
        mode: "auto",
      },
    });

    results.push({
      action: "auto_updated",
      applicationId: match.application.id,
      previousStatus,
      nextStatus: classification.status,
      confidence: classification.confidence,
      updated,
    });
  }

  return NextResponse.json({ processed: results.length, results });
}
