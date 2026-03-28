import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPdfBytes } from "@/lib/pdf/extract-text";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 500 });
    }
    if (!fileEntry.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Resume must be a PDF file" }, { status: 500 });
    }
    if (fileEntry.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: "Resume must be 5MB or smaller" }, { status: 500 });
    }

    const parsed_text = await extractTextFromPdfBytes(
      new Uint8Array(await fileEntry.arrayBuffer())
    );
    if (!parsed_text.trim()) {
      return NextResponse.json(
        {
          error:
            "No extractable text was found in this PDF. Try a text-based PDF or paste your resume text manually.",
        },
        { status: 422 }
      );
    }
    return NextResponse.json({ parsed_text });
  } catch (e) {
    console.error("Resume parse failed", e);
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
