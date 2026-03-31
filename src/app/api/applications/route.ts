import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/types/database";
import {
  APPLICATION_CREATE_KEYS,
  APPLICATION_UPDATE_KEYS,
  buildWriteStatusCandidates,
  isStatusCheckConstraintError,
  isValidApplicationSource,
  isValidStatus,
  isValidStatusChangeSource,
  normalizeStatus,
} from "@/lib/services/applications/status-utils";

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const createDemoApp = (
  id: string,
  company: string,
  role: string,
  status: Application["status"],
  displayOrder: number
): Application => {
  const now = new Date().toISOString();
  return {
    id,
    user_id: "demo-user",
    company,
    role,
    status,
    applied_date: now.slice(0, 10),
    job_url: "",
    job_description: "",
    source: "manual",
    board: "",
    external_job_id: "",
    location: "Remote",
    notes: "",
    fit_score: null,
    match_score: null,
    salary_range: "",
    fit_analysis: "",
    contact_name: "",
    contact_email: "",
    generated_email: "",
    next_action_at: null,
    last_contacted_at: null,
    resume_version_id: null,
    display_order: displayOrder,
    last_status_change_source: "manual",
    last_status_change_reason: "Seeded demo application.",
    last_status_change_at: now,
    created_at: now,
    updated_at: now,
    ai_metadata: {},
  };
};

const demoApps = new Map<string, Application>([
  ["demo-1", createDemoApp("demo-1", "Vercel", "Software Engineer Intern", "applied", 0)],
  ["demo-2", createDemoApp("demo-2", "Stripe", "Backend Intern", "interview", 1)],
  ["demo-3", createDemoApp("demo-3", "Notion", "Product Intern", "saved", 2)],
]);
const statusAliasCacheByUser = new Map<string, Partial<Record<Application["status"], string>>>();

const APPLICATION_COLUMNS = "*";

const ensureObjectBody = async (
  request: Request
): Promise<Record<string, unknown> | NextResponse> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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

const insertTimelineEvent = async (
  supabase: ReturnType<typeof createClient>,
  application: Application,
  event: {
    event_type: "status_change" | "contact" | "interview" | "artifact" | "note" | "system";
    title: string;
    description: string;
  }
) => {
  try {
    await supabase.from("application_timeline_events").insert({
      user_id: application.user_id,
      application_id: application.id,
      event_type: event.event_type,
      title: event.title,
      description: event.description,
      occurred_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to insert application timeline event", error);
  }
};

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

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      const list = Array.from(demoApps.values())
        .sort((a, b) => a.display_order - b.display_order)
        .map((app) => ({ ...app, status: normalizeStatus(app.status) ?? "saved" }));
      return NextResponse.json(list);
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    const cachedAliases: Partial<Record<Application["status"], string>> =
      statusAliasCacheByUser.get(user.id) ?? {};
    for (const row of rows) {
      const raw = row.status;
      const canonical = normalizeStatus(raw);
      if (canonical && typeof raw === "string") {
        cachedAliases[canonical] = raw;
      }
    }
    statusAliasCacheByUser.set(user.id, cachedAliases);

    const normalized = rows.map((row) => ({
      ...row,
      status: normalizeStatus(row.status) ?? "saved",
    }));
    return NextResponse.json(normalized as unknown as Application[]);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured) {
      const body = await ensureObjectBody(request);
      if (body instanceof NextResponse) return body;
      const company = body.company;
      const role = body.role;
      if (typeof company !== "string" || company.trim() === "") {
        return NextResponse.json({ error: "Company is required" }, { status: 400 });
      }
      if (typeof role !== "string" || role.trim() === "") {
        return NextResponse.json({ error: "Role is required" }, { status: 400 });
      }
      const status = normalizeStatus(body.status) ?? "saved";
      const displayOrder = Number.isInteger(body.display_order) ? Number(body.display_order) : demoApps.size;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const created: Application = {
        id,
        user_id: "demo-user",
        company: company.trim(),
        role: role.trim(),
        status,
        applied_date: typeof body.applied_date === "string" ? body.applied_date : "",
        location: typeof body.location === "string" ? body.location : "",
        job_url: typeof body.job_url === "string" ? body.job_url : "",
        job_description: typeof body.job_description === "string" ? body.job_description : "",
        source:
          body.source === "extension" ||
          body.source === "imported" ||
          body.source === "referral" ||
          body.source === "automation"
            ? body.source
            : "manual",
        board: typeof body.board === "string" ? body.board : "",
        external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : "",
        notes: typeof body.notes === "string" ? body.notes : "",
        fit_score: typeof body.fit_score === "number" ? body.fit_score : null,
        match_score: typeof body.match_score === "number" ? body.match_score : null,
        salary_range: typeof body.salary_range === "string" ? body.salary_range : "",
        fit_analysis: typeof body.fit_analysis === "string" ? body.fit_analysis : "",
        contact_name: typeof body.contact_name === "string" ? body.contact_name : "",
        contact_email: typeof body.contact_email === "string" ? body.contact_email : "",
        generated_email: typeof body.generated_email === "string" ? body.generated_email : "",
        next_action_at: typeof body.next_action_at === "string" ? body.next_action_at : null,
        last_contacted_at: typeof body.last_contacted_at === "string" ? body.last_contacted_at : null,
        resume_version_id: typeof body.resume_version_id === "string" ? body.resume_version_id : null,
        display_order: Math.max(displayOrder, 0),
        last_status_change_source: "manual",
        last_status_change_reason: "Created via demo fallback.",
        last_status_change_at: now,
        created_at: now,
        updated_at: now,
      };
      demoApps.set(id, created);
      return NextResponse.json(created);
    }

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
        { status: 400 }
      );
    }
    if (typeof role !== "string" || role.trim() === "") {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const insertPayload: Record<string, unknown> = {
      company: company.trim(),
      role: role.trim(),
      status: "saved",
      last_status_change_source: "manual",
      last_status_change_reason: "Created manually.",
      last_status_change_at: new Date().toISOString(),
      user_id: user.id,
    };

    for (const [key, value] of Object.entries(body)) {
      if (!APPLICATION_CREATE_KEYS.has(key)) continue;
      if (value === undefined) continue;
      if (key === "status") {
        const normalized = normalizeStatus(value);
        if (!normalized || !isValidStatus(normalized)) {
          return NextResponse.json(
            { error: "Invalid application status" },
            { status: 400 }
          );
        }
        insertPayload[key] = normalized;
        continue;
      }
      if (key === "last_status_change_source") {
        if (!isValidStatusChangeSource(value)) {
          return NextResponse.json(
            { error: "Invalid status change source" },
            { status: 400 }
          );
        }
        insertPayload[key] = value;
        continue;
      }
      if (key === "source") {
        if (!isValidApplicationSource(value)) {
          return NextResponse.json(
            { error: "Invalid application source" },
            { status: 400 }
          );
        }
        insertPayload[key] = value;
        continue;
      }
      insertPayload[key] = value;
    }

    if ("display_order" in insertPayload) {
      const displayOrder = Number(insertPayload.display_order);
      if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        return NextResponse.json(
          { error: "display_order must be a non-negative integer" },
          { status: 400 }
        );
      }
      insertPayload.display_order = displayOrder;
    }

    const { data, error } = await supabase
      .from("applications")
      .insert(insertPayload)
      .select(APPLICATION_COLUMNS)
      .single();

    if (error) {
      if (
        typeof insertPayload.status === "string" &&
        isStatusCheckConstraintError(error.message)
      ) {
        const fallbackCandidates = buildWriteStatusCandidates(
          insertPayload.status as Application["status"],
          statusAliasCacheByUser,
          user.id
        ).filter((candidate) => candidate !== insertPayload.status);

        for (const candidate of fallbackCandidates) {
          const { data: retryData, error: retryError } = await supabase
            .from("applications")
            .insert({ ...insertPayload, status: candidate })
            .select(APPLICATION_COLUMNS)
            .single();
          if (!retryError) {
            if (typeof candidate === "string") {
              const normalizedCandidate = normalizeStatus(candidate);
              if (normalizedCandidate) {
                const aliases = statusAliasCacheByUser.get(user.id) ?? {};
                aliases[normalizedCandidate] = candidate;
                statusAliasCacheByUser.set(user.id, aliases);
              }
            }
            return NextResponse.json({
              ...(retryData as unknown as Application),
              status:
                normalizeStatus((retryData as unknown as Record<string, unknown>).status) ??
                "saved",
            });
          }
        }
        console.error("Applications POST status fallback exhausted", {
          requested: insertPayload.status,
          tried: fallbackCandidates,
          error: error.message,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const created = {
      ...(data as unknown as Application),
      status: normalizeStatus((data as unknown as Record<string, unknown>).status) ?? "saved",
    };
    await insertTimelineEvent(supabase, created, {
      event_type: "system",
      title: "Application created",
      description: "Added to the tracker workspace.",
    });
    return NextResponse.json(created);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!isSupabaseConfigured) {
      const body = await ensureObjectBody(request);
      if (body instanceof NextResponse) return body;
      const id = body.id;
      if (typeof id !== "string" || id.trim() === "") {
        return NextResponse.json({ error: "Missing id in request body" }, { status: 400 });
      }
      const existing = demoApps.get(id);
      if (!existing) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
      }
      const nextStatus = body.status !== undefined ? normalizeStatus(body.status) : existing.status;
      if (body.status !== undefined && !nextStatus) {
        return NextResponse.json({ error: "Invalid application status" }, { status: 400 });
      }
      const nextDisplayOrder =
        body.display_order !== undefined ? Number(body.display_order) : existing.display_order;
      if (!Number.isInteger(nextDisplayOrder) || nextDisplayOrder < 0) {
        return NextResponse.json(
          { error: "display_order must be a non-negative integer" },
          { status: 400 }
        );
      }
      const updated: Application = {
        ...existing,
        company: typeof body.company === "string" ? body.company : existing.company,
        role: typeof body.role === "string" ? body.role : existing.role,
        location: typeof body.location === "string" ? body.location : existing.location,
        notes: typeof body.notes === "string" ? body.notes : existing.notes,
        job_url: typeof body.job_url === "string" ? body.job_url : existing.job_url,
        job_description:
          typeof body.job_description === "string" ? body.job_description : existing.job_description ?? "",
        source:
          body.source === "extension" ||
          body.source === "imported" ||
          body.source === "referral" ||
          body.source === "automation" ||
          body.source === "manual"
            ? body.source
            : existing.source ?? "manual",
        board: typeof body.board === "string" ? body.board : existing.board ?? "",
        external_job_id:
          typeof body.external_job_id === "string" ? body.external_job_id : existing.external_job_id ?? "",
        fit_score: typeof body.fit_score === "number" ? body.fit_score : existing.fit_score,
        match_score: typeof body.match_score === "number" ? body.match_score : existing.match_score ?? null,
        fit_analysis: typeof body.fit_analysis === "string" ? body.fit_analysis : existing.fit_analysis,
        generated_email:
          typeof body.generated_email === "string" ? body.generated_email : existing.generated_email,
        ai_metadata:
          body.ai_metadata !== undefined && typeof body.ai_metadata === "object" && body.ai_metadata !== null
            ? (body.ai_metadata as Record<string, unknown>)
            : existing.ai_metadata ?? {},
        applied_date:
          typeof body.applied_date === "string"
            ? body.applied_date
            : existing.applied_date,
        next_action_at:
          typeof body.next_action_at === "string"
            ? body.next_action_at
            : existing.next_action_at ?? null,
        last_contacted_at:
          typeof body.last_contacted_at === "string"
            ? body.last_contacted_at
            : existing.last_contacted_at ?? null,
        resume_version_id:
          typeof body.resume_version_id === "string"
            ? body.resume_version_id
            : existing.resume_version_id ?? null,
        status: nextStatus ?? existing.status,
        display_order: nextDisplayOrder,
        updated_at: new Date().toISOString(),
      };
      demoApps.set(id, updated);
      return NextResponse.json(updated);
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await ensureObjectBody(request);
    if (body instanceof NextResponse) return body;

    const id = body.id;
    if (typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { error: "Missing id in request body" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    const hasIncomingStatus = "status" in body;
    for (const [key, value] of Object.entries(body)) {
      if (!APPLICATION_UPDATE_KEYS.has(key) || key === "id") continue;
      if (value === undefined) continue;
      if (key === "status") {
        const normalized = normalizeStatus(value);
        if (!normalized || !isValidStatus(normalized)) {
          return NextResponse.json(
            { error: "Invalid application status" },
            { status: 400 }
          );
        }
        updates[key] = normalized;
        continue;
      }
      if (key === "last_status_change_source") {
        if (!isValidStatusChangeSource(value)) {
          return NextResponse.json(
            { error: "Invalid status change source" },
            { status: 400 }
          );
        }
        updates[key] = value;
        continue;
      }
      if (key === "source") {
        if (!isValidApplicationSource(value)) {
          return NextResponse.json(
            { error: "Invalid application source" },
            { status: 400 }
          );
        }
        updates[key] = value;
        continue;
      }
      updates[key] = value;
    }

    if (hasIncomingStatus) {
      if (!("last_status_change_source" in updates)) {
        updates.last_status_change_source = "manual";
      }
      if (!("last_status_change_reason" in updates)) {
        updates.last_status_change_reason = "Updated from tracker workflow.";
      }
      if (!("last_status_change_at" in updates)) {
        updates.last_status_change_at = new Date().toISOString();
      }
    }

    if ("display_order" in updates) {
      const displayOrder = Number(updates.display_order);
      if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        return NextResponse.json(
          { error: "display_order must be a non-negative integer" },
          { status: 400 }
        );
      }
      updates.display_order = displayOrder;
    }

    if (Object.keys(updates).length === 0) {
      const { data: existing, error: fetchError } = await supabase
        .from("applications")
        .select(APPLICATION_COLUMNS)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }
      return NextResponse.json(existing as unknown as Application);
    }

    const { data, error } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(APPLICATION_COLUMNS)
      .maybeSingle();

    if (error) {
      if (
        typeof updates.status === "string" &&
        isStatusCheckConstraintError(error.message)
      ) {
        const fallbackCandidates = buildWriteStatusCandidates(
          updates.status as Application["status"],
          statusAliasCacheByUser,
          user.id
        ).filter((candidate) => candidate !== updates.status);
        for (const candidate of fallbackCandidates) {
          const { data: retryData, error: retryError } = await supabase
            .from("applications")
            .update({ ...updates, status: candidate })
            .eq("id", id)
            .eq("user_id", user.id)
            .select(APPLICATION_COLUMNS)
            .maybeSingle();
          if (!retryError && retryData) {
            if (typeof candidate === "string") {
              const normalizedCandidate = normalizeStatus(candidate);
              if (normalizedCandidate) {
                const aliases = statusAliasCacheByUser.get(user.id) ?? {};
                aliases[normalizedCandidate] = candidate;
                statusAliasCacheByUser.set(user.id, aliases);
              }
            }
            return NextResponse.json({
              ...(retryData as unknown as Application),
              status:
                normalizeStatus((retryData as unknown as Record<string, unknown>).status) ??
                "saved",
            });
          }
        }
        console.error("Applications PUT status fallback exhausted", {
          id,
          requested: updates.status,
          tried: fallbackCandidates,
          error: error.message,
        });
      }
      console.error("Applications PUT failed", { id, updates, error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: "Application not found or no access." },
        { status: 404 }
      );
    }

    const updated = {
      ...(data as unknown as Application),
      status: normalizeStatus((data as unknown as Record<string, unknown>).status) ?? "saved",
    };
    if (hasIncomingStatus) {
      await insertTimelineEvent(supabase, updated, {
        event_type: "status_change",
        title: `Moved to ${updated.status}`,
        description:
          typeof updates.last_status_change_reason === "string"
            ? updates.last_status_change_reason
            : "Updated from tracker workflow.",
      });
    }
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isSupabaseConfigured) {
      const body = await ensureObjectBody(request);
      if (body instanceof NextResponse) return body;
      const id = body.id;
      if (typeof id !== "string" || id.trim() === "") {
        return NextResponse.json({ error: "Missing id in request body" }, { status: 400 });
      }
      demoApps.delete(id);
      return NextResponse.json({ success: true });
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await ensureObjectBody(request);
    if (body instanceof NextResponse) return body;

    const id = body.id;
    if (typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { error: "Missing id in request body" },
        { status: 400 }
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
