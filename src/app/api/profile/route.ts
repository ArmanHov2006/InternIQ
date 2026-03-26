import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Education,
  Experience,
  Project,
  Skill,
} from "@/types/database";

type ProfilePayload = {
  profile: Profile | null;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
};

const PROFILE_NOT_FOUND_CODE = "PGRST116";

const ALLOWED_PROFILE_UPDATE_KEYS = [
  "full_name",
  "headline",
  "bio",
  "username",
  "website_url",
  "github_url",
  "linkedin_url",
  "twitter_url",
  "location",
  "is_open_to_work",
] as const;

async function fetchCollectionsByUserId(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
} | { error: string }> {
  const [eduRes, expRes, projRes, skillRes] = await Promise.all([
    supabase
      .from("education")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true }),
    supabase
      .from("experience")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true }),
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true }),
    supabase
      .from("skills")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true }),
  ]);

  if (eduRes.error) return { error: eduRes.error.message };
  if (expRes.error) return { error: expRes.error.message };
  if (projRes.error) return { error: projRes.error.message };
  if (skillRes.error) return { error: skillRes.error.message };

  return {
    education: (eduRes.data ?? []) as Education[],
    experience: (expRes.data ?? []) as Experience[],
    projects: (projRes.data ?? []) as Project[],
    skills: (skillRes.data ?? []) as Skill[],
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const username = request.nextUrl.searchParams.get("username")?.trim();

    if (username) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError) {
        if (profileError.code === PROFILE_NOT_FOUND_CODE) {
          const empty: ProfilePayload = {
            profile: null,
            education: [],
            experience: [],
            projects: [],
            skills: [],
          };
          return NextResponse.json(empty);
        }
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        );
      }

      const collections = await fetchCollectionsByUserId(supabase, profile.id);
      if ("error" in collections) {
        return NextResponse.json({ error: collections.error }, { status: 500 });
      }

      const payload: ProfilePayload = {
        profile: profile as Profile,
        ...collections,
      };
      return NextResponse.json(payload);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      if (profileError.code === PROFILE_NOT_FOUND_CODE) {
        const empty: ProfilePayload = {
          profile: null,
          education: [],
          experience: [],
          projects: [],
          skills: [],
        };
        return NextResponse.json(empty);
      }
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    const collections = await fetchCollectionsByUserId(supabase, user.id);
    if ("error" in collections) {
      return NextResponse.json({ error: collections.error }, { status: 500 });
    }

    const payload: ProfilePayload = {
      profile: profile as Profile,
      ...collections,
    };
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 500 }
      );
    }

    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 500 }
      );
    }

    const record = body as Record<string, unknown>;
    const updates: Partial<
      Pick<
        Profile,
        | "full_name"
        | "headline"
        | "bio"
        | "username"
        | "website_url"
        | "github_url"
        | "linkedin_url"
        | "twitter_url"
        | "location"
        | "is_open_to_work"
      >
    > = {};

    for (const key of ALLOWED_PROFILE_UPDATE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        const value = record[key];
        if (value !== undefined) {
          (updates as Record<string, unknown>)[key] = value;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      const { data: existing, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: fetchError.message },
          { status: 500 }
        );
      }
      return NextResponse.json(existing as Profile);
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as Profile);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
