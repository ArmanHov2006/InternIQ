import { NextResponse } from "next/server";
import { isSupabaseConfigured, withAuth } from "@/lib/server/route-utils";
import { isJobDiscoveryEnabled } from "@/lib/features";
import { getDiscoveryProfileContext } from "@/lib/server/resume-keywords";
import {
  buildResumeContextPreview,
  defaultDiscoveryPreferencesRow,
  mergeDiscoveryPreferencesRow,
  type DiscoveryPreferencesRow,
} from "@/lib/services/discovery/resume-context";
import type { DiscoveryResumeContextOverrides } from "@/types/database";

const SYSTEM_PROMPT = `You are a career search optimization assistant. Given a candidate's resume and profile, extract the best search parameters to maximize relevant job hits on major job boards.

Return ONLY valid JSON with this exact shape (no markdown, no explanation):
{
  "skills": ["skill1", "skill2", ...],
  "locations": ["location1", ...],
  "role_types": ["intern", "entry-level", "junior"],
  "note": "brief search focus note"
}

Rules:
- skills: Extract 6-10 concrete, searchable technical skills. Use industry-standard names (e.g. "Python" not "python programming"). Include frameworks, languages, tools, and platforms. Prioritize skills that appear in job postings.
- locations: Extract cities/regions mentioned. Always include "Remote" if relevant. Use "City, State/Province" format.
- role_types: Based on experience level. For students/new grads: ["intern", "entry-level", "junior"]. For 2-5 years: ["junior", "mid-level"]. For 5+: ["mid-level", "senior"].
- note: One sentence describing ideal role focus, e.g. "backend engineering at AI-focused startups"`;

const extractWithAi = async (
  resumeText: string,
  profileContextText: string
): Promise<DiscoveryResumeContextOverrides | null> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const userMessage = `Resume and profile:\n\n${resumeText}\n\n${profileContextText}`.slice(0, 12000);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: userMessage }],
      system: SYSTEM_PROMPT,
    }),
  });

  if (!res.ok) return null;

  const body = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = body.content?.find((b) => b.type === "text")?.text;
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as {
      skills?: string[];
      locations?: string[];
      role_types?: string[];
      note?: string;
    };
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills.map(String).slice(0, 12) : [],
      locations: Array.isArray(parsed.locations) ? parsed.locations.map(String).slice(0, 5) : [],
      role_types: Array.isArray(parsed.role_types) ? parsed.role_types.map(String).slice(0, 4) : [],
      note: typeof parsed.note === "string" ? parsed.note.slice(0, 200) : "",
    };
  } catch {
    return null;
  }
};

export async function POST() {
  if (!isJobDiscoveryEnabled()) {
    return NextResponse.json({ error: "Job discovery is disabled." }, { status: 404 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      overrides: { skills: [], locations: [], role_types: ["intern", "entry-level", "junior"], note: "" },
      source: "fallback",
    });
  }

  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const profileContext = await getDiscoveryProfileContext(supabase, user.id);

  if (!profileContext.resumeText.trim()) {
    return NextResponse.json(
      { error: "No resume found. Upload a resume first to use auto-fill." },
      { status: 400 }
    );
  }

  // Try AI extraction first
  const aiResult = await extractWithAi(profileContext.resumeText, profileContext.profileContextText);

  if (aiResult) {
    return NextResponse.json({ overrides: aiResult, source: "ai" });
  }

  // Fallback to regex-based detection
  const { data: prefRow } = await supabase
    .from("discovery_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const prefs = mergeDiscoveryPreferencesRow(prefRow as DiscoveryPreferencesRow | null);
  const preview = buildResumeContextPreview({ profileContext, preferences: prefs });

  const fallbackOverrides: DiscoveryResumeContextOverrides = {
    skills: preview.detected_skills,
    locations: preview.detected_locations,
    role_types: preview.detected_role_types.length > 0
      ? preview.detected_role_types
      : defaultDiscoveryPreferencesRow().role_types ?? [],
    note: "",
  };

  return NextResponse.json({ overrides: fallbackOverrides, source: "fallback" });
}
