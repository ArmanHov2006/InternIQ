import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyInboundEmail } from "@/lib/services/email-ingestion/classifier";
import { fetchGmailMessageEnvelope } from "@/lib/services/email-ingestion/gmail-client";
import type { EmailConnectionRecord, GmailMessageEnvelope } from "@/lib/services/email-ingestion/types";
import type { ApplicationStatus } from "@/lib/constants";

const STATUS_RANK: Record<ApplicationStatus, number> = {
  saved: 0,
  applied: 1,
  interview: 2,
  offer: 3,
  rejected: 4,
};

type ApplicationRow = {
  id: string;
  company: string;
  status: ApplicationStatus;
  contact_email: string;
  last_status_change_source: "manual" | "gmail_auto" | "gmail_confirmed" | "system";
  last_status_change_at: string | null;
};

const normalizeText = (value: string): string => value.trim().toLowerCase();

const getEmailDomain = (email: string): string => {
  const [, domain = ""] = email.toLowerCase().split("@");
  return domain;
};

const scoreApplicationMatch = (app: ApplicationRow, envelope: GmailMessageEnvelope): number => {
  const fromEmail = normalizeText(envelope.fromEmail);
  const fromDomain = getEmailDomain(fromEmail);
  const company = normalizeText(app.company);
  const subjectSnippet = normalizeText(`${envelope.subject} ${envelope.snippet}`);
  let score = 0;

  if (app.contact_email && normalizeText(app.contact_email) === fromEmail) {
    score += 85;
  }
  if (fromDomain && company && fromDomain.includes(company.replace(/\s+/g, ""))) {
    score += 35;
  }
  if (subjectSnippet.includes(company)) {
    score += 20;
  }

  return score;
};

const shouldProtectRecentManualEdit = (application: ApplicationRow): boolean => {
  if (application.last_status_change_source !== "manual") return false;
  if (!application.last_status_change_at) return false;
  const ageMs = Date.now() - new Date(application.last_status_change_at).getTime();
  return ageMs < 6 * 60 * 60 * 1000;
};

const canPromoteToStatus = (
  from: ApplicationStatus,
  to: ApplicationStatus,
  explicitNegative: boolean
): boolean => {
  if (to === "rejected") return explicitNegative;
  return STATUS_RANK[to] >= STATUS_RANK[from];
};

export const emailAutomationInternals = {
  shouldProtectRecentManualEdit,
  canPromoteToStatus,
  scoreApplicationMatch,
};

type ProcessResult = {
  processingStatus: "applied" | "suggested" | "ignored" | "dead_letter";
  reason: string;
};

const updateEventStatus = async (
  supabaseAdmin: SupabaseClient,
  eventId: string,
  values: Record<string, unknown>
) => {
  await supabaseAdmin.from("email_events").update(values).eq("id", eventId);
};

export const processInboundGmailMessage = async (
  connection: EmailConnectionRecord,
  messageId: string,
  historyId: string | null,
  supabaseAdmin: SupabaseClient,
  options?: { allowExistingEventId?: string }
): Promise<ProcessResult> => {
  const envelope = await fetchGmailMessageEnvelope(connection, messageId, supabaseAdmin);
  const classifier = classifyInboundEmail(envelope.subject, envelope.snippet);

  let eventId = options?.allowExistingEventId ?? "";
  if (!eventId) {
    const existingEvent = await supabaseAdmin
      .from("email_events")
      .select("id, processing_status")
      .eq("provider", "gmail")
      .eq("provider_message_id", envelope.messageId)
      .maybeSingle();

    if (existingEvent.data?.id) {
      return {
        processingStatus:
          (existingEvent.data.processing_status as ProcessResult["processingStatus"]) ?? "ignored",
        reason: "Duplicate message ignored due to idempotency key.",
      };
    }

    const eventInsert = await supabaseAdmin
      .from("email_events")
      .insert({
        user_id: connection.user_id,
        connection_id: connection.id,
        provider: "gmail",
        provider_message_id: envelope.messageId,
        provider_thread_id: envelope.threadId,
        provider_history_id: historyId ?? envelope.historyId,
        from_email: envelope.fromEmail,
        subject: envelope.subject,
        snippet: envelope.snippet,
        received_at: envelope.receivedAt,
        normalized_signal: classifier.signal,
        proposed_status: classifier.proposedStatus,
        confidence: classifier.confidence,
        raw_payload: envelope.rawPayload,
        processing_status: "pending",
        processing_attempts: 1,
      })
      .select("id")
      .single();

    if (eventInsert.error) {
      throw new Error(eventInsert.error.message);
    }
    eventId = eventInsert.data.id as string;
  } else {
    const { error: updateExistingEventError } = await supabaseAdmin
      .from("email_events")
      .update({
        provider_thread_id: envelope.threadId,
        provider_history_id: historyId ?? envelope.historyId,
        from_email: envelope.fromEmail,
        subject: envelope.subject,
        snippet: envelope.snippet,
        received_at: envelope.receivedAt,
        normalized_signal: classifier.signal,
        proposed_status: classifier.proposedStatus,
        confidence: classifier.confidence,
        raw_payload: envelope.rawPayload,
        processing_status: "pending",
        last_error: "",
      })
      .eq("id", eventId);
    if (updateExistingEventError) throw new Error(updateExistingEventError.message);
  }

  if (!classifier.proposedStatus) {
    await updateEventStatus(supabaseAdmin, eventId, {
      processing_status: "ignored",
      processed_at: new Date().toISOString(),
      last_error: "",
    });
    return { processingStatus: "ignored", reason: "No actionable pipeline signal." };
  }

  const appsQuery = await supabaseAdmin
    .from("applications")
    .select("id, company, status, contact_email, last_status_change_source, last_status_change_at")
    .eq("user_id", connection.user_id);
  if (appsQuery.error) {
    await updateEventStatus(supabaseAdmin, eventId, {
      processing_status: "dead_letter",
      last_error: appsQuery.error.message,
      processed_at: new Date().toISOString(),
    });
    throw new Error(appsQuery.error.message);
  }

  const candidates = (appsQuery.data ?? []) as unknown as ApplicationRow[];
  const matched = candidates
    .map((application) => ({ application, score: scoreApplicationMatch(application, envelope) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!matched || matched.score < 20) {
    await updateEventStatus(supabaseAdmin, eventId, {
      processing_status: "ignored",
      last_error: "No application match reached confidence threshold.",
      processed_at: new Date().toISOString(),
    });
    return { processingStatus: "ignored", reason: "No matching application found." };
  }

  const app = matched.application;
  const toStatus = classifier.proposedStatus;
  const fromStatus = app.status;
  const confidenceThreshold = Number(connection.auto_update_threshold ?? 0.9);
  const confidenceEligible =
    connection.automation_mode === "fully_auto" || classifier.confidence >= confidenceThreshold;
  const transitionAllowed = canPromoteToStatus(fromStatus, toStatus, classifier.explicitNegative);
  const protectManual = shouldProtectRecentManualEdit(app);

  const shouldAutoApply =
    connection.automation_mode !== "suggestions_only" &&
    confidenceEligible &&
    transitionAllowed &&
    !protectManual;

  if (shouldAutoApply && fromStatus !== toStatus) {
    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        status: toStatus,
        last_status_change_source: "gmail_auto",
        last_status_change_reason: classifier.reason,
        last_status_change_at: new Date().toISOString(),
      })
      .eq("id", app.id)
      .eq("user_id", connection.user_id);

    if (updateError) {
      await updateEventStatus(supabaseAdmin, eventId, {
        processing_status: "dead_letter",
        last_error: updateError.message,
        processed_at: new Date().toISOString(),
      });
      throw new Error(updateError.message);
    }

    await updateEventStatus(supabaseAdmin, eventId, {
      processing_status: "applied",
      processed_at: new Date().toISOString(),
      last_error: "",
    });
    return { processingStatus: "applied", reason: "Applied high-confidence Gmail automation update." };
  }

  const reason =
    !transitionAllowed && !classifier.explicitNegative
      ? "Blocked auto-downgrade due to anti-flap guard."
      : protectManual
        ? "Recent manual status change protected from immediate automation."
        : "Confidence below threshold or suggestions mode enabled.";

  const { error: suggestionError } = await supabaseAdmin.from("application_status_suggestions").insert({
    user_id: connection.user_id,
    application_id: app.id,
    email_event_id: eventId,
    from_status: fromStatus,
    to_status: toStatus,
    confidence: classifier.confidence,
    reason: `${classifier.reason} ${reason}`.trim(),
    status: "pending",
  });
  if (suggestionError) {
    await updateEventStatus(supabaseAdmin, eventId, {
      processing_status: "dead_letter",
      last_error: suggestionError.message,
      processed_at: new Date().toISOString(),
    });
    throw new Error(suggestionError.message);
  }

  await updateEventStatus(supabaseAdmin, eventId, {
    processing_status: "suggested",
    processed_at: new Date().toISOString(),
    last_error: "",
  });
  return { processingStatus: "suggested", reason };
};
