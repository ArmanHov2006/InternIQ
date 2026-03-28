import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ChatRequestBody = {
  messages?: { role: string; content: string }[];
  context?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: "Please log in again." }, { status: 401 });
    }

    const body = (await request.json()) as ChatRequestBody;
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.FASTAPI_URL;
    if (!fastApiUrl) {
      return NextResponse.json(
        { error: "AI backend is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(`${fastApiUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        messages: body.messages,
        context: body.context ?? {},
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const msg =
        typeof payload?.detail === "string"
          ? payload.detail
          : typeof payload?.error === "string"
          ? payload.error
          : "Chat request failed.";
      return NextResponse.json({ error: msg }, { status: response.status });
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
