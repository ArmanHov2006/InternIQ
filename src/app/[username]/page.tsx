import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicProfile } from "@/components/profile/public-profile";
import type {
  Profile,
  Education,
  Experience,
  Project,
  Skill,
} from "@/types/database";

const PROFILE_NOT_FOUND = "PGRST116";

export type PublicProfilePageData = {
  profile: Profile;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
};

const getPublicProfileData = cache(
  async (username: string): Promise<PublicProfilePageData | null> => {
    const supabase = createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (profileError) {
      if (profileError.code === PROFILE_NOT_FOUND) return null;
      throw new Error(profileError.message);
    }
    if (!profile) return null;

    const userId = profile.id;

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

    if (eduRes.error) throw new Error(eduRes.error.message);
    if (expRes.error) throw new Error(expRes.error.message);
    if (projRes.error) throw new Error(projRes.error.message);
    if (skillRes.error) throw new Error(skillRes.error.message);

    return {
      profile: profile as Profile,
      education: (eduRes.data ?? []) as Education[],
      experience: (expRes.data ?? []) as Experience[],
      projects: (projRes.data ?? []) as Project[],
      skills: (skillRes.data ?? []) as Skill[],
    };
  }
);

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const data = await getPublicProfileData(params.username);
  if (!data) {
    return {
      title: "Profile | InternIQ",
      description: "View student profiles on InternIQ.",
    };
  }

  const { profile } = data;
  const description =
    [profile.headline, profile.bio].filter(Boolean).join(" — ") ||
    `Portfolio and profile for ${profile.full_name} on InternIQ.`;

  return {
    title: `${profile.full_name} (@${profile.username}) | InternIQ`,
    description,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const data = await getPublicProfileData(params.username);
  if (!data) notFound();

  return <PublicProfile {...data} />;
}
