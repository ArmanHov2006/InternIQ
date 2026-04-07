import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Resume } from "@/types/database";
import { extractTextFromPdfBytes } from "@/lib/pdf/extract-text";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const runtime = "nodejs";

type AuthSuccess = {
  supabase: ReturnType<typeof createClient>;
  user: NonNullable<Awaited<ReturnType<ReturnType<typeof createClient>["auth"]["getUser"]>>["data"]["user"]>;
};

type AuthFailure = {
  response: NextResponse;
};

type ResumeRow = Resume & {
  storage_path?: string | null;
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

const parseBody = async (
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

const normalizeFileName = (value: string, fallback: string): string => {
  const cleaned = value.replace(/[^\w.\- ]/g, "").trim();
  return cleaned || fallback;
};

const decodeStoragePathFromUrl = (urlString: string | null | undefined): string | null => {
  if (!urlString) return null;
  try {
    const url = new URL(urlString);
    const marker = "/storage/v1/object/public/resumes/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    const encoded = url.pathname.slice(idx + marker.length);
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
};

const clearPrimaryResume = async (
  supabase: AuthSuccess["supabase"],
  userId: string
): Promise<string | null> => {
  const { error } = await supabase
    .from("resumes")
    .update({ is_primary: false })
    .eq("user_id", userId);
  return error?.message ?? null;
};

const fetchResumeRow = async (
  supabase: AuthSuccess["supabase"],
  userId: string,
  id: string
): Promise<{ row: ResumeRow | null; error: string | null }> => {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { row: null, error: error.message };
  return { row: (data ?? null) as ResumeRow | null, error: null };
};

const createManualResume = async (
  supabase: AuthSuccess["supabase"],
  userId: string,
  body: Record<string, unknown>
) => {
  const parsedText = typeof body.parsed_text === "string" ? body.parsed_text.trim() : "";
  if (!parsedText) {
    return NextResponse.json(
      { error: "Resume text is required for manual resumes." },
      { status: 422 }
    );
  }

  const fileName = normalizeFileName(
    typeof body.file_name === "string" ? body.file_name : "",
    "Manual Resume"
  );
  const isPrimary = typeof body.is_primary === "boolean" ? body.is_primary : false;

  if (isPrimary) {
    const clearPrimaryError = await clearPrimaryResume(supabase, userId);
    if (clearPrimaryError) {
      return NextResponse.json({ error: clearPrimaryError }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      file_name: fileName,
      file_url: null,
      storage_path: null,
      source_type: "manual",
      parsed_text: parsedText,
      is_primary: isPrimary,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Resume);
};

const createUploadedResume = async (
  supabase: AuthSuccess["supabase"],
  userId: string,
  request: Request
) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!fileEntry.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Resume must be a PDF file" }, { status: 400 });
  }
  if (fileEntry.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ error: "Resume must be 5MB or smaller" }, { status: 400 });
  }

  const parsedText = await extractTextFromPdfBytes(new Uint8Array(await fileEntry.arrayBuffer()));
  if (!parsedText.trim()) {
    return NextResponse.json(
      {
        error:
          "No extractable text was found in this PDF. Try a text-based PDF or paste your resume text manually.",
      },
      { status: 422 }
    );
  }

  const isPrimary = String(formData.get("is_primary") ?? "").toLowerCase() === "true";
  const filename = normalizeFileName(fileEntry.name, "resume.pdf");
  const storagePath = `${userId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, fileEntry, { upsert: true });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("resumes").getPublicUrl(storagePath);

  if (isPrimary) {
    const clearPrimaryError = await clearPrimaryResume(supabase, userId);
    if (clearPrimaryError) {
      return NextResponse.json({ error: clearPrimaryError }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      file_name: filename,
      file_url: publicUrl,
      storage_path: storagePath,
      source_type: "upload",
      parsed_text: parsedText,
      is_primary: isPrimary,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Resume);
};

export async function GET() {
  try {
    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []) as Resume[]);
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

    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("application/json")) {
      const body = await parseBody(request);
      if (body instanceof NextResponse) return body;
      return createManualResume(supabase, user.id, body);
    }

    if (contentType.includes("multipart/form-data")) {
      return createUploadedResume(supabase, user.id, request);
    }

    return NextResponse.json(
      { error: "Unsupported content type. Use PDF upload or JSON resume text." },
      { status: 400 }
    );
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

    const body = await parseBody(request);
    if (body instanceof NextResponse) return body;

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Missing id in request body" }, { status: 400 });
    }

    const fetched = await fetchResumeRow(supabase, user.id, id);
    if (fetched.error) {
      return NextResponse.json({ error: fetched.error }, { status: 500 });
    }
    if (!fetched.row) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.is_primary === "boolean") {
      updates.is_primary = body.is_primary;
      if (body.is_primary) {
        const clearPrimaryError = await clearPrimaryResume(supabase, user.id);
        if (clearPrimaryError) {
          return NextResponse.json({ error: clearPrimaryError }, { status: 500 });
        }
      }
    }

    const wantsManualFields =
      typeof body.file_name === "string" || typeof body.parsed_text === "string";
    if (wantsManualFields && fetched.row.source_type !== "manual") {
      return NextResponse.json(
        { error: "Only manual resumes can be edited inline." },
        { status: 400 }
      );
    }

    if (typeof body.file_name === "string") {
      updates.file_name = normalizeFileName(body.file_name, fetched.row.file_name || "Manual Resume");
    }
    if (typeof body.parsed_text === "string") {
      const parsedText = body.parsed_text.trim();
      if (!parsedText) {
        return NextResponse.json({ error: "Resume text cannot be empty." }, { status: 422 });
      }
      updates.parsed_text = parsedText;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(fetched.row as Resume);
    }

    const { data, error } = await supabase
      .from("resumes")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as Resume);
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

    const body = await parseBody(request);
    if (body instanceof NextResponse) return body;

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Missing id in request body" }, { status: 400 });
    }

    const fetched = await fetchResumeRow(supabase, user.id, id);
    if (fetched.error) {
      return NextResponse.json({ error: fetched.error }, { status: 500 });
    }
    if (!fetched.row) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    const storagePath = fetched.row.storage_path ?? decodeStoragePathFromUrl(fetched.row.file_url);
    if (storagePath) {
      const { error: storageError } = await supabase.storage.from("resumes").remove([storagePath]);
      if (storageError) {
        return NextResponse.json({ error: storageError.message }, { status: 500 });
      }
    }

    const { error } = await supabase
      .from("resumes")
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
