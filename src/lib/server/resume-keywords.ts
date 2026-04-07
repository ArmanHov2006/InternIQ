import type { SupabaseClient } from "@supabase/supabase-js";

const uniqueNonEmpty = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))
  );

const compactText = (values: Array<string | null | undefined>): string =>
  values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

type ResumeRow = {
  parsed_text?: string;
  is_primary?: boolean;
};

type SkillRow = {
  name?: string;
};

type ProfileRow = {
  headline?: string;
  bio?: string;
  location?: string;
};

type ExperienceRow = {
  title?: string;
  company?: string;
  description?: string;
};

type ProjectRow = {
  name?: string;
  description?: string;
  tech_stack?: string[];
};

export type DiscoveryProfileContext = {
  resumeText: string;
  profileKeywords: string[];
  profileContextText: string;
};

const toExperienceSnippet = (row: ExperienceRow): string =>
  compactText([
    row.title && row.company ? `${row.title} at ${row.company}` : row.title ?? row.company,
    row.description,
  ]);

const toProjectSnippet = (row: ProjectRow): string =>
  compactText([
    row.name,
    row.description,
    Array.isArray(row.tech_stack) && row.tech_stack.length
      ? `Tech stack: ${row.tech_stack.join(", ")}`
      : null,
  ]);

export const getDiscoveryProfileContext = async (
  supabase: SupabaseClient,
  userId: string
): Promise<DiscoveryProfileContext> => {
  const [resumeRes, skillRes, profileRes, experienceRes, projectRes] = await Promise.all([
    supabase
      .from("resumes")
      .select("parsed_text, is_primary")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("skills").select("name").eq("user_id", userId),
    supabase.from("profiles").select("headline, bio, location").eq("id", userId).maybeSingle(),
    supabase
      .from("experience")
      .select("title, company, description")
      .eq("user_id", userId)
      .order("display_order", { ascending: true }),
    supabase
      .from("projects")
      .select("name, description, tech_stack")
      .eq("user_id", userId)
      .order("display_order", { ascending: true }),
  ]);

  const resumeRows =
    !resumeRes.error && Array.isArray(resumeRes.data) ? (resumeRes.data as ResumeRow[]) : [];
  const primaryResume =
    resumeRows.find((row) => row.is_primary && row.parsed_text?.trim()) ??
    resumeRows.find((row) => row.parsed_text?.trim()) ??
    null;
  const resumeText = primaryResume?.parsed_text?.trim() ?? "";

  const profileKeywords =
    !skillRes.error && Array.isArray(skillRes.data)
      ? uniqueNonEmpty((skillRes.data as SkillRow[]).map((row) => row.name))
      : [];

  const profileRow =
    !profileRes.error && profileRes.data && typeof profileRes.data === "object"
      ? (profileRes.data as ProfileRow)
      : null;
  const experienceRows =
    !experienceRes.error && Array.isArray(experienceRes.data)
      ? (experienceRes.data as ExperienceRow[])
      : [];
  const projectRows =
    !projectRes.error && Array.isArray(projectRes.data) ? (projectRes.data as ProjectRow[]) : [];

  const profileContextText = compactText([
    resumeText,
    profileRow?.headline ? `Headline: ${profileRow.headline}` : null,
    profileRow?.bio ? `Bio: ${profileRow.bio}` : null,
    profileRow?.location ? `Location: ${profileRow.location}` : null,
    ...experienceRows.slice(0, 4).map(toExperienceSnippet),
    ...projectRows.slice(0, 4).map(toProjectSnippet),
  ]);

  return {
    resumeText,
    profileKeywords,
    profileContextText,
  };
};

export const getResumeAndKeywords = async (supabase: SupabaseClient, userId: string) => {
  const context = await getDiscoveryProfileContext(supabase, userId);
  return {
    resumeText: context.resumeText,
    profileKeywords: context.profileKeywords,
    profileContextText: context.profileContextText,
  };
};
