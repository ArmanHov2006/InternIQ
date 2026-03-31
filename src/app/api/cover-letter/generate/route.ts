import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAiRateLimit } from "@/lib/rate-limit";

type RequestBody = {
  job_url?: string;
  resume_text?: string;
  company?: string;
  role?: string;
  tone?: "professional" | "casual" | "enthusiastic";
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

    const rateLimited = await checkAiRateLimit(request, user.id);
    if (rateLimited) return rateLimited;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: "Please log in again." }, { status: 401 });
    }

    const body = (await request.json()) as RequestBody;
    if (
      !body.job_url?.trim() ||
      !body.resume_text?.trim() ||
      !body.company?.trim() ||
      !body.role?.trim()
    ) {
      return NextResponse.json(
        { error: "job_url, resume_text, company, and role are required." },
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

    const response = await fetch(`${fastApiUrl}/api/cover-letter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        job_url: body.job_url.trim(),
        resume_text: body.resume_text.trim(),
        company: body.company.trim(),
        role: body.role.trim(),
        tone: body.tone || "professional",
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: parseError(payload, "Failed to generate cover letter.") },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
