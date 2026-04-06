import type { SupabaseClient } from "@supabase/supabase-js";

export const getResumeAndKeywords = async (supabase: SupabaseClient, userId: string) => {
  const [resumeRes, skillRes] = await Promise.all([
    supabase
      .from("resumes")
      .select("parsed_text, is_primary")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("skills").select("name").eq("user_id", userId),
  ]);

  const resumeRows =
    !resumeRes.error && Array.isArray(resumeRes.data)
      ? (resumeRes.data as Array<{ parsed_text?: string; is_primary?: boolean }>)
      : [];
  const primaryResume =
    resumeRows.find((row) => row.is_primary && row.parsed_text?.trim()) ??
    resumeRows.find((row) => row.parsed_text?.trim()) ??
    null;
  const profileKeywords =
    !skillRes.error && Array.isArray(skillRes.data)
      ? (skillRes.data as Array<{ name?: string }>)
          .map((row) => row.name?.trim())
          .filter((value): value is string => Boolean(value))
      : [];

  return {
    resumeText: primaryResume?.parsed_text?.trim() ?? "",
    profileKeywords,
  };
};
