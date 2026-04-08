import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureObjectBody, isSupabaseConfigured, withAuth } from "@/lib/server/route-utils";
import { isJobDiscoveryEnabled } from "@/lib/features";
import { rateLimit } from "@/lib/rate-limit";
import { getResumeAndKeywords } from "@/lib/server/resume-keywords";
import { generateDraftAnswersMarkdown } from "@/lib/services/discovery/draft-answers";
import type { Application, Opportunity } from "@/types/database";

type CoverLetterResult = {
  title?: string;
  content?: string;
};

const reserveSmartApplySlots = (userId: string, count: number): boolean => {
  for (let i = 0; i < count; i += 1) {
    const r = rateLimit(`discovery:smart:${userId}`, 60 * 60 * 1000, 10);
    if (!r.success) return false;
  }
  return true;
};

async function smartApplyOne(
  supabase: SupabaseClient,
  userId: string,
  opportunityId: string,
  request: Request
): Promise<{ application: Application; opportunity: Opportunity } | { error: string }> {
  const { data: opp, error: oppErr } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (oppErr || !opp) {
    return { error: oppErr?.message ?? "Opportunity not found." };
  }

  const row = opp as Opportunity;
  const origin = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") ?? "";

  let applicationId = row.application_id;

  if (!applicationId) {
    const res = await fetch(`${origin}/api/applications`, {
      method: "POST",
      headers: { cookie, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        company: row.company,
        role: row.role,
        status: "saved",
        location: row.location,
        job_url: row.job_url,
        job_description: row.job_description,
        source: "automation",
        board: row.board,
        external_job_id: row.external_job_id ?? row.api_job_id,
        match_score: row.match_score,
        notes: row.match_summary,
      }),
    });
    const created = (await res.json()) as Application | { error?: string };
    if (!res.ok || !("id" in created)) {
      return { error: ("error" in created && created.error) || "Could not create application." };
    }
    applicationId = created.id;

    const { error: linkErr } = await supabase
      .from("opportunities")
      .update({
        application_id: applicationId,
        status: "saved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("user_id", userId);

    if (linkErr) {
      return { error: linkErr.message };
    }
  }

  const { resumeText, profileContextText } = await getResumeAndKeywords(supabase, userId);
  const tailoredContext = profileContextText || resumeText;

  try {
    const draft = await generateDraftAnswersMarkdown({
      company: row.company,
      role: row.role,
      jobDescription: row.job_description,
      resumeText: tailoredContext,
    });

    await supabase.from("application_artifacts").insert({
      user_id: userId,
      application_id: applicationId,
      artifact_type: "draft_answers",
      title: "Draft application answers",
      content: draft,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Draft generation failed." };
  }

  try {
    const coverRes = await fetch(`${origin}/api/cover-letter/generate`, {
      method: "POST",
      headers: { cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        job_url: row.job_url,
        resume_text: tailoredContext,
        company: row.company,
        role: row.role,
        tone: "professional",
      }),
    });

    if (coverRes.ok) {
      const coverPayload = (await coverRes.json()) as CoverLetterResult;
      if (typeof coverPayload.title === "string" && typeof coverPayload.content === "string") {
        const { data: applicationRow } = await supabase
          .from("applications")
          .select("ai_metadata")
          .eq("id", applicationId)
          .eq("user_id", userId)
          .maybeSingle();

        const currentMeta =
          applicationRow?.ai_metadata && typeof applicationRow.ai_metadata === "object"
            ? (applicationRow.ai_metadata as Record<string, unknown>)
            : {};

        await supabase
          .from("applications")
          .update({
            ai_metadata: {
              ...currentMeta,
              coverLetter: {
                title: coverPayload.title,
                content: coverPayload.content,
                tone: "professional",
              },
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId)
          .eq("user_id", userId);
      }
    }
  } catch {
    /* optional */
  }

  const { data: nextOpp } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", row.id)
    .eq("user_id", userId)
    .single();

  const { data: nextApp } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .single();

  if (!nextOpp || !nextApp) {
    return { error: "Could not reload saved records." };
  }

  return {
    application: nextApp as Application,
    opportunity: nextOpp as Opportunity,
  };
}

export async function POST(request: Request) {
  if (!isJobDiscoveryEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const auth = await withAuth();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;

  const body = await ensureObjectBody(request);
  if (body instanceof NextResponse) return body;

  const single = typeof body.opportunityId === "string" ? body.opportunityId.trim() : "";
  const multi = Array.isArray(body.opportunityIds)
    ? (body.opportunityIds as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : [];

  const ids = multi.length ? multi : single ? [single] : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "opportunityId or opportunityIds required." }, { status: 400 });
  }

  if (!reserveSmartApplySlots(user.id, ids.length)) {
    return NextResponse.json(
      { error: "Smart Apply rate limit (10 actions per hour). Try again later." },
      { status: 429 }
    );
  }

  const results: Array<{ application?: Application; opportunity?: Opportunity; error?: string }> = [];

  for (const id of ids) {
    const r = await smartApplyOne(supabase, user.id, id, request);
    if ("error" in r) {
      results.push({ error: r.error });
    } else {
      results.push({ application: r.application, opportunity: r.opportunity });
    }
  }

  if (ids.length === 1) {
    const first = results[0];
    if (first?.error) {
      return NextResponse.json({ error: first.error }, { status: 400 });
    }
    if (first?.application && first?.opportunity) {
      return NextResponse.json({
        application: first.application,
        opportunity: first.opportunity,
      });
    }
  }

  return NextResponse.json({ results });
}
