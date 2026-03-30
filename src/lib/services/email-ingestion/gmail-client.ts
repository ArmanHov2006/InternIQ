import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailConnectionRecord, GmailMessageEnvelope } from "@/lib/services/email-ingestion/types";
import { decryptTokenIfEncrypted, encryptToken } from "@/lib/crypto";

const GOOGLE_OAUTH_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

const getRequiredGoogleEnv = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth configuration.");
  }
  return { clientId, clientSecret };
};

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const refreshGmailAccessToken = async (
  connection: EmailConnectionRecord,
  supabaseAdmin: SupabaseClient
): Promise<string> => {
  const { clientId, clientSecret } = getRequiredGoogleEnv();
  const refreshTokenPlain = decryptTokenIfEncrypted(connection.refresh_token);
  if (!refreshTokenPlain) {
    throw new Error("Missing Gmail refresh token.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshTokenPlain,
  });

  const response = await fetch(GOOGLE_OAUTH_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh Gmail token: ${text}`);
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  const expiresAt = new Date(Date.now() + payload.expires_in * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from("email_connections")
    .update({
      access_token: encryptToken(payload.access_token),
      access_token_expires_at: expiresAt,
      is_active: true,
    })
    .eq("id", connection.id);
  if (error) throw new Error(error.message);

  return payload.access_token;
};

const isTokenStale = (connection: EmailConnectionRecord): boolean => {
  if (!connection.access_token_expires_at) return true;
  return new Date(connection.access_token_expires_at).getTime() <= Date.now() + 30_000;
};

const ensureActiveToken = async (
  connection: EmailConnectionRecord,
  supabaseAdmin: SupabaseClient
): Promise<string> => {
  const accessPlain = decryptTokenIfEncrypted(connection.access_token);
  if (!isTokenStale(connection) && accessPlain) {
    return accessPlain;
  }
  return refreshGmailAccessToken(connection, supabaseAdmin);
};

const gmailRequestWithRetry = async (
  url: string,
  token: string,
  init: RequestInit = {},
  retries = 3
): Promise<Response> => {
  let attempt = 0;
  let lastError: Error | null = null;
  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
      if (response.status >= 500 && response.status < 600 && attempt < retries) {
        await sleep(250 * 2 ** attempt);
        attempt += 1;
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown Gmail request error.");
      if (attempt >= retries) break;
      await sleep(250 * 2 ** attempt);
      attempt += 1;
    }
  }
  throw lastError ?? new Error("Failed Gmail request.");
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
};

const extractHeader = (
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string
): string => {
  if (!headers) return "";
  const found = headers.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return found?.value ?? "";
};

const extractFromAddress = (value: string): string => {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim().toLowerCase();
};

export const fetchGmailMessageEnvelope = async (
  connection: EmailConnectionRecord,
  messageId: string,
  supabaseAdmin: SupabaseClient
): Promise<GmailMessageEnvelope> => {
  const token = await ensureActiveToken(connection, supabaseAdmin);
  const response = await gmailRequestWithRetry(
    `${GMAIL_API_BASE}/messages/${encodeURIComponent(messageId)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
    token
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch Gmail message ${messageId}: ${response.status}`);
  }

  const payload = (await response.json()) as {
    id: string;
    threadId: string;
    historyId?: string;
    snippet?: string;
    payload?: {
      headers?: Array<{ name?: string; value?: string }>;
      body?: { data?: string };
      parts?: Array<{ body?: { data?: string } }>;
    };
    internalDate?: string;
  };

  const fromHeader = extractHeader(payload.payload?.headers, "From");
  const subject = extractHeader(payload.payload?.headers, "Subject");
  const bodyData =
    payload.payload?.body?.data ??
    payload.payload?.parts?.find((part) => part.body?.data)?.body?.data;
  const decodedBody = bodyData ? decodeBase64Url(bodyData) : "";
  const snippet = payload.snippet || decodedBody.slice(0, 400);

  return {
    messageId: payload.id,
    threadId: payload.threadId,
    historyId: payload.historyId ?? null,
    fromEmail: extractFromAddress(fromHeader),
    subject,
    snippet,
    receivedAt: payload.internalDate ? new Date(Number(payload.internalDate)).toISOString() : null,
    rawPayload: payload as unknown as Record<string, unknown>,
  };
};

export const startGmailWatch = async (
  connection: EmailConnectionRecord,
  topicName: string,
  supabaseAdmin: SupabaseClient
): Promise<void> => {
  const token = await ensureActiveToken(connection, supabaseAdmin);
  const response = await gmailRequestWithRetry(`${GMAIL_API_BASE}/watch`, token, {
    method: "POST",
    body: JSON.stringify({
      topicName,
      labelIds: ["INBOX"],
      labelFilterBehavior: "INCLUDE",
    }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to start Gmail watch: ${message}`);
  }
  const payload = (await response.json()) as { expiration?: string };
  const watchExpiration = payload.expiration
    ? new Date(Number(payload.expiration)).toISOString()
    : null;
  const { error } = await supabaseAdmin
    .from("email_connections")
    .update({ watch_expiration: watchExpiration })
    .eq("id", connection.id);
  if (error) throw new Error(error.message);
};

export const fetchHistoryMessageIds = async (
  connection: EmailConnectionRecord,
  historyId: string,
  supabaseAdmin: SupabaseClient
): Promise<string[]> => {
  const token = await ensureActiveToken(connection, supabaseAdmin);
  const response = await gmailRequestWithRetry(
    `${GMAIL_API_BASE}/history?startHistoryId=${encodeURIComponent(historyId)}&historyTypes=messageAdded`,
    token
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Gmail history: ${text}`);
  }
  const payload = (await response.json()) as {
    history?: Array<{
      messagesAdded?: Array<{ message?: { id?: string } }>;
    }>;
  };
  const ids = new Set<string>();
  for (const history of payload.history ?? []) {
    for (const added of history.messagesAdded ?? []) {
      const id = added.message?.id;
      if (typeof id === "string" && id.length > 0) ids.add(id);
    }
  }
  return Array.from(ids);
};

export const parsePubSubWebhookBody = (
  body: unknown
): { emailAddress: string; historyId: string } | null => {
  if (!body || typeof body !== "object") return null;
  const message = (body as { message?: { data?: string } }).message;
  if (!message?.data) return null;
  try {
    const json = JSON.parse(Buffer.from(message.data, "base64").toString("utf8")) as {
      emailAddress?: string;
      historyId?: string;
    };
    if (!json.emailAddress || !json.historyId) return null;
    return { emailAddress: json.emailAddress.toLowerCase(), historyId: String(json.historyId) };
  } catch {
    return null;
  }
};
