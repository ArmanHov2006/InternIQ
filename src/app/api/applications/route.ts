import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/types/database";
import { APPLICATION_STATUSES } from "@/lib/constants";

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
    location: "Remote",
    notes: "",
    fit_score: null,
    salary_range: "",
    fit_analysis: "",
    contact_name: "",
    contact_email: "",
    generated_email: "",
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
  "last_status_change_source",
  "last_status_change_reason",
  "last_status_change_at",
  "ai_metadata",
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
  "last_status_change_source",
  "last_status_change_reason",
  "last_status_change_at",
  "ai_metadata",
  "id",
]);

const STATUS_CHANGE_SOURCES = [
  "manual",
  "gmail_auto",
  "gmail_confirmed",
  "system",
] as const;
const isValidStatusChangeSource = (
  value: unknown
): value is (typeof STATUS_CHANGE_SOURCES)[number] =>
  typeof value === "string" &&
  (STATUS_CHANGE_SOURCES as readonly string[]).includes(value);

const isValidStatus = (value: unknown): boolean =>
  typeof value === "string" &&
  (APPLICATION_STATUSES as readonly string[]).includes(value);

const DB_STATUS_CANDIDATES: Record<Application["status"], string[]> = {
  saved: ["saved", "wishlist", "bookmarked", "draft"],
  applied: ["applied", "application_submitted", "submitted"],
  interview: [
    "interview",
    "interviewing",
    "onsite",
    "final_round",
    "final round",
    "phone_screen",
    "phone-screen",
    "phone screen",
    "screening",
    "phone",
  ],
  offer: ["offer", "offered", "accepted"],
  rejected: ["rejected", "declined", "no_offer", "no offer"],
};

const LEGACY_TO_CANONICAL: Record<string, Application["status"]> = Object.entries(
  DB_STATUS_CANDIDATES
).reduce((acc, [canonical, candidates]) => {
  for (const candidate of candidates) {
    const key = candidate.trim().toLowerCase().replace(/[\s-]+/g, "_");
    acc[key] = canonical as Application["status"];
  }
  return acc;
}, {} as Record<string, Application["status"]>);

const normalizeStatus = (value: unknown): Application["status"] | null => {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return LEGACY_TO_CANONICAL[key] ?? null;
};

const legacyStatusCandidates = (status: Application["status"]): string[] =>
  DB_STATUS_CANDIDATES[status] ?? [status];

const toTitleCase = (value: string): string =>
  value
    .split(" ")
    .map((segment) =>
      segment.length ? segment[0].toUpperCase() + segment.slice(1).toLowerCase() : segment
    )
    .join(" ");

const buildWriteStatusCandidates = (
  canonicalStatus: Application["status"],
  userId?: string
): string[] => {
  const spaced = canonicalStatus.replace(/_/g, " ");
  const hyphenated = canonicalStatus.replace(/_/g, "-");
  const userAlias = userId ? statusAliasCacheByUser.get(userId)?.[canonicalStatus] : undefined;

  const candidates = [
    userAlias,
    canonicalStatus,
    spaced,
    hyphenated,
    toTitleCase(spaced),
    toTitleCase(hyphenated.replace(/-/g, " ")),
    spaced.toUpperCase(),
    hyphenated.toUpperCase(),
    ...legacyStatusCandidates(canonicalStatus),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return Array.from(new Set(candidates));
};

const isStatusCheckConstraintError = (message: string): boolean =>
  message.toLowerCase().includes("applications_status_check");

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
        notes: typeof body.notes === "string" ? body.notes : "",
        fit_score: typeof body.fit_score === "number" ? body.fit_score : null,
        salary_range: "",
        fit_analysis: "",
        contact_name: "",
        contact_email: "",
        generated_email: "",
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

    return NextResponse.json({
      ...(data as unknown as Application),
      status: normalizeStatus((data as unknown as Record<string, unknown>).status) ?? "saved",
    });
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
        fit_score: typeof body.fit_score === "number" ? body.fit_score : existing.fit_score,
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

    return NextResponse.json({
      ...(data as unknown as Application),
      status: normalizeStatus((data as unknown as Record<string, unknown>).status) ?? "saved",
    });
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
