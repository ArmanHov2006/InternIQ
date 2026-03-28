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

const decodeStoragePathFromUrl = (urlString: string): string | null => {
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

export async function GET() {
  try {
    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []) as Resume[]);
  } catch (e) {
    console.error("Resume upload failed", e);
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

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
      return NextResponse.json(
        { error: "Resume must be a PDF file" },
        { status: 400 }
      );
    }
    if (fileEntry.size > MAX_RESUME_BYTES) {
      return NextResponse.json(
        { error: "Resume must be 5MB or smaller" },
        { status: 400 }
      );
    }
    const parsedText = await extractTextFromPdfBytes(
      new Uint8Array(await fileEntry.arrayBuffer())
    );
    if (!parsedText.trim()) {
      return NextResponse.json(
        {
          error:
            "No extractable text was found in this PDF. Try a text-based PDF or paste your resume text manually.",
        },
        { status: 422 }
      );
    }

    const isPrimary =
      String(formData.get("is_primary") ?? "").toLowerCase() === "true";
    const filename = fileEntry.name.replace(/[^\w.\- ]/g, "").trim() || "resume.pdf";
    const storagePath = `${user.id}/${filename}`;

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
      const { error: clearPrimaryError } = await supabase
        .from("resumes")
        .update({ is_primary: false })
        .eq("user_id", user.id);
      if (clearPrimaryError) {
        return NextResponse.json(
          { error: clearPrimaryError.message },
          { status: 500 }
        );
      }
    }

    const { data, error } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: filename,
        file_url: publicUrl,
        parsed_text: parsedText,
        is_primary: isPrimary,
      })
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

export async function PUT(request: Request) {
  try {
    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await parseBody(request);
    if (body instanceof NextResponse) return body;

    const id = body.id;
    const isPrimary = body.is_primary;
    if (typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { error: "Missing id in request body" },
        { status: 400 }
      );
    }
    if (typeof isPrimary !== "boolean") {
      return NextResponse.json(
        { error: "is_primary must be a boolean" },
        { status: 400 }
      );
    }

    if (isPrimary) {
      const { error: clearPrimaryError } = await supabase
        .from("resumes")
        .update({ is_primary: false })
        .eq("user_id", user.id);
      if (clearPrimaryError) {
        return NextResponse.json(
          { error: clearPrimaryError.message },
          { status: 500 }
        );
      }
    }

    const { data, error } = await supabase
      .from("resumes")
      .update({ is_primary: isPrimary })
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

    const id = body.id;
    if (typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { error: "Missing id in request body" },
        { status: 400 }
      );
    }

    const { data: row, error: fetchError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const storagePath = decodeStoragePathFromUrl(row.file_url);
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("resumes")
        .remove([storagePath]);
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
