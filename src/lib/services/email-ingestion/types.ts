import type { ApplicationStatus } from "@/lib/constants";

export type AutomationMode = "suggestions_only" | "hybrid" | "fully_auto";

export interface ParsedEmailSignal {
  signal: "rejection" | "interview" | "offer" | "applied" | "unknown";
  proposedStatus: ApplicationStatus | null;
  confidence: number;
  reason: string;
  explicitNegative: boolean;
}

export interface EmailConnectionRecord {
  id: string;
  user_id: string;
  provider: "gmail";
  provider_account_email: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string | null;
  watch_expiration: string | null;
  automation_mode: AutomationMode;
  auto_update_threshold: number;
  is_active: boolean;
}

export interface GmailMessageEnvelope {
  messageId: string;
  threadId: string;
  historyId: string | null;
  fromEmail: string;
  subject: string;
  snippet: string;
  receivedAt: string | null;
  rawPayload: Record<string, unknown>;
}
