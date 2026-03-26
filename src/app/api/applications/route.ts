import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/types/database";
import {
  normalizeStoredApplicationStatus,
  resolveApplicationStatus,
  type ApplicationStatus,
} from "@/lib/constants";

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

const APPLICATION_CREATE_KEYS = new Set([
  "company",
  "role",
  "job_url",
  "status",
  "location",
  "salary_range",
  "notes",
  "contact_name",
  "contact_email",
  "fit_score",
  "fit_analysis",
  "generated_email",
  "display_order",
  "applied_date",
]);

const APPLICATION_UPDATE_KEYS = new Set([
  "company",
  "role",
  "job_url",
  "status",
  "location",
  "salary_range",
  "notes",
  "contact_name",
  "contact_email",
  "fit_score",
  "fit_analysis",
  "generated_email",
  "display_order",
  "applied_date",
  "id",
]);

const ensureObjectBody = async (
  request: Request
): Promise<Record<string, unknown> | NextResponse> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 500 });
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 500 });
  }
  return body as Record<string, unknown>;
};

type AuthSuccess = {
  supabase: ReturnType<typeof createClient>;
  user: NonNullable<Awaited<ReturnType<ReturnType<typeof createClient>["auth"]["getUser"]>>["data"]["user"]>;
};

type AuthFailure = {
  response: NextResponse;
};

type StatusEventSource = "manual" | "email_auto" | "email_suggested" | "undo";

const withAuth = async (): Promise<AuthSuccess | AuthFailure> => {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return {
      response: NextResponse.json({ error: authError.message }, { status: 500 }),
    };
  }
  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user };
};

const normalizeApplicationRecord = (value: unknown): Application => {
  const raw = value as Application;
  return {
    ...raw,
    status: normalizeStoredApplicationStatus(raw.status),
  };
};

const explainStatusConstraintError = (message: string): string => {
  if (message.includes("applications_status_check")) {
    return "Your database status constraint is outdated. Apply migration 002_tracker_linear9_statuses.sql and retry.";
  }
  return message;
};

const logStatusEvent = async ({
  supabase,
  application,
  previousStatus,
  nextStatus,
  source,
  confidence,
  evidence,
  metadata,
}: {
  supabase: ReturnType<typeof createClient>;
  application: Pick<Application, "id" | "user_id">;
  previousStatus: string;
  nextStatus: string;
  source: StatusEventSource;
  confidence: number;
  evidence: string;
  metadata?: Record<string, unknown>;
}) => {
  await supabase.from("application_status_events").insert({
    application_id: application.id,
    user_id: application.user_id,
    previous_status: previousStatus,
    next_status: nextStatus,
    source,
    confidence,
    evidence,
    metadata: metadata ?? {},
  });
};

export async function GET() {
  try {
    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("applications")
      .select(APPLICATION_COLUMNS)
      .eq("user_id", user.id)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: explainStatusConstraintError(error.message) },
        { status: 500 }
      );
    }

    const normalized = ((data ?? []) as unknown[]).map((row) =>
      normalizeApplicationRecord(row)
    );
    return NextResponse.json(normalized);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await ensureObjectBody(request);
    if (body instanceof NextResponse) return body;

    const company = body.company;
    const role = body.role;
    if (typeof company !== "string" || company.trim() === "") {
      return NextResponse.json(
        { error: "Company is required" },
        { status: 500 }
      );
    }
    if (typeof role !== "string" || role.trim() === "") {
      return NextResponse.json({ error: "Role is required" }, { status: 500 });
    }

    const insertPayload: Record<string, unknown> = {
      company: company.trim(),
      role: role.trim(),
      status: "saved",
      status_source: "manual",
      status_confidence: 1,
      suggestion_pending: false,
      user_id: user.id,
    };

    for (const [key, value] of Object.entries(body)) {
      if (!APPLICATION_CREATE_KEYS.has(key)) continue;
      if (value === undefined) continue;
      if (key === "status") {
        const resolved = resolveApplicationStatus(value);
        if (!resolved) {
          return NextResponse.json(
            { error: "Invalid application status" },
            { status: 500 }
          );
        }
        insertPayload[key] = resolved;
        continue;
      }
      insertPayload[key] = value;
    }

    const { data, error } = await supabase
      .from("applications")
      .insert(insertPayload)
      .select(APPLICATION_COLUMNS)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = normalizeApplicationRecord(data);
    await logStatusEvent({
      supabase,
      application: normalized,
      previousStatus: "saved",
      nextStatus: normalized.status,
      source: "manual",
      confidence: 1,
      evidence: "Created manually",
    });

    return NextResponse.json(normalized);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await ensureObjectBody(request);
    if (body instanceof NextResponse) return body;

    const bulkUpdates = body.updates;
    if (Array.isArray(bulkUpdates)) {
      const validated = bulkUpdates.map((item) => {
        if (item === null || typeof item !== "object" || Array.isArray(item)) {
          throw new Error("Invalid bulk update payload.");
        }
        const update = item as Record<string, unknown>;
        const id = update.id;
        const status = update.status;
        const displayOrder = update.display_order;
        if (typeof id !== "string" || id.trim() === "") {
          throw new Error("Each bulk update item must include a valid id.");
        }
        const resolvedStatus = resolveApplicationStatus(status);
        if (!resolvedStatus) {
          throw new Error("Each bulk update item must include a valid status.");
        }
        if (typeof displayOrder !== "number" || Number.isNaN(displayOrder)) {
          throw new Error("Each bulk update item must include numeric display_order.");
        }
        return { id, status: resolvedStatus, display_order: displayOrder };
      });

      const updates = await Promise.all(
        validated.map(async (entry) => {
          const { data: existing } = await supabase
            .from("applications")
            .select("id, user_id, status")
            .eq("id", entry.id)
            .eq("user_id", user.id)
            .single();
          const previousStatus = normalizeStoredApplicationStatus(existing?.status);
          const { data, error } = await supabase
            .from("applications")
            .update({
              status: entry.status,
              display_order: entry.display_order,
              previous_status: previousStatus,
              status_source: "manual",
              status_confidence: 1,
              status_evidence: "Moved manually",
              auto_updated_at: null,
              suggestion_pending: false,
            })
            .eq("id", entry.id)
            .eq("user_id", user.id)
            .select(APPLICATION_COLUMNS)
            .single();
          if (error) {
            throw new Error(explainStatusConstraintError(error.message));
          }
          const normalized = normalizeApplicationRecord(data);
          if (previousStatus !== normalized.status) {
            await logStatusEvent({
              supabase,
              application: normalized,
              previousStatus,
              nextStatus: normalized.status,
              source: "manual",
              confidence: 1,
              evidence: "Moved manually",
            });
          }
          return normalized;
        })
      );

      return NextResponse.json(updates);
    }

    const id = body.id;
    if (typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { error: "Missing id in request body" },
        { status: 500 }
      );
    }

    const updates: Record<string, unknown> = {};
    let hasStatusUpdate = false;
    let targetStatus: ApplicationStatus | null = null;
    for (const [key, value] of Object.entries(body)) {
      if (!APPLICATION_UPDATE_KEYS.has(key) || key === "id") continue;
      if (value === undefined) continue;
      if (key === "status") {
        const resolved = resolveApplicationStatus(value);
        if (!resolved) {
          return NextResponse.json(
            { error: "Invalid application status" },
            { status: 500 }
          );
        }
        hasStatusUpdate = true;
        targetStatus = resolved;
        updates[key] = resolved;
        continue;
      }
      updates[key] = value;
    }

    if (hasStatusUpdate) {
      const { data: existing } = await supabase
        .from("applications")
        .select("status")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      const previousStatus = normalizeStoredApplicationStatus(existing?.status);
      updates.status_source = "manual";
      updates.status_confidence = 1;
      updates.status_evidence = "Updated manually";
      updates.previous_status = previousStatus;
      updates.suggestion_pending = false;
      updates.auto_updated_at = null;
    }

    const { data, error } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(APPLICATION_COLUMNS)
      .single();

    if (error) {
      return NextResponse.json(
        { error: explainStatusConstraintError(error.message) },
        { status: 500 }
      );
    }

    const normalized = normalizeApplicationRecord(data);

    if (hasStatusUpdate && targetStatus) {
      await logStatusEvent({
        supabase,
        application: normalized,
        previousStatus: normalized.previous_status || targetStatus,
        nextStatus: targetStatus,
        source: "manual",
        confidence: 1,
        evidence: "Updated manually",
      });
    }

    return NextResponse.json(normalized);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await ensureObjectBody(request);
    if (body instanceof NextResponse) return body;

    const id = body.id;
    if (typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { error: "Missing id in request body" },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
