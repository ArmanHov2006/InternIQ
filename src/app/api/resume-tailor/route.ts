import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  resume_text?: string;
  job_description?: string;
};

const parseError = (payload: unknown, fallback: string): string => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof (payload as { detail: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
};

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: "Please log in again." }, { status: 401 });
    }

    const body = (await request.json()) as RequestBody;
    if (!body.resume_text?.trim() || !body.job_description?.trim()) {
      return NextResponse.json(
        { error: "resume_text and job_description are required." },
        { status: 400 }
      );
    }

    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.FASTAPI_URL;
    if (!fastApiUrl) {
      return NextResponse.json(
        { error: "FastAPI URL is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(`${fastApiUrl}/api/resume-tailor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        resume_text: body.resume_text.trim(),
        job_description: body.job_description.trim(),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: parseError(payload, "Failed to tailor resume.") },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
