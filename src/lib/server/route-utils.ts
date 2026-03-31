import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const ensureObjectBody = async (
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

export type AuthSuccess = {
  supabase: ReturnType<typeof createClient>;
  user: NonNullable<Awaited<ReturnType<ReturnType<typeof createClient>["auth"]["getUser"]>>["data"]["user"]>;
};

export type AuthFailure = {
  response: NextResponse;
};

export const withAuth = async (): Promise<AuthSuccess | AuthFailure> => {
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
