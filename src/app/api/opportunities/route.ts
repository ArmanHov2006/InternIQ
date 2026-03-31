import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Opportunity } from "@/types/database";
import {
  buildOpportunityDedupeKey,
  computeMatchInsight,
  inferBoardFromUrl,
} from "@/lib/services/career-os";
import {
  demoOpportunityStore,
} from "@/lib/services/career-os-demo";
import {
  ensureObjectBody,
  isSupabaseConfigured,
  withAuth,
} from "@/lib/server/route-utils";
import { isSchemaCompatError } from "@/lib/server/schema-compat";

const getResumeAndKeywords = async (
  supabase: ReturnType<typeof createClient>,
  userId: string
) => {
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

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        Array.from(demoOpportunityStore.values()).sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
      );
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("user_id", user.id)
      .order("match_score", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });

    if (error) {
      if (isSchemaCompatError(error)) {
        return NextResponse.json(
          Array.from(demoOpportunityStore.values()).sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json((data ?? []) as Opportunity[]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await ensureObjectBody(request);
    if (body instanceof NextResponse) return body;

    const company = typeof body.company === "string" ? body.company.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    if (!company) return NextResponse.json({ error: "Company is required." }, { status: 400 });
    if (!role) return NextResponse.json({ error: "Role is required." }, { status: 400 });

    const jobDescription = typeof body.job_description === "string" ? body.job_description.trim() : "";
    const board =
      typeof body.board === "string" && body.board.trim()
        ? body.board.trim()
        : inferBoardFromUrl(typeof body.job_url === "string" ? body.job_url : "");

    if (!isSupabaseConfigured) {
      const dedupeKey = buildOpportunityDedupeKey({
        company,
        role,
        job_url: typeof body.job_url === "string" ? body.job_url : "",
        external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : "",
      });

      const existing = Array.from(demoOpportunityStore.values()).find(
        (opportunity) =>
          buildOpportunityDedupeKey(opportunity) === dedupeKey
      );
      if (existing) return NextResponse.json(existing);

      const insight =
        typeof body.match_score === "number"
          ? {
              score: body.match_score,
              summary: typeof body.match_summary === "string" ? body.match_summary : "",
              matched_keywords: Array.isArray(body.matched_keywords) ? body.matched_keywords.map(String) : [],
              missing_keywords: Array.isArray(body.missing_keywords) ? body.missing_keywords.map(String) : [],
            }
          : computeMatchInsight({ jobDescription });

      const now = new Date().toISOString();
      const opportunity: Opportunity = {
        id: crypto.randomUUID(),
        user_id: "demo-user",
        company,
        role,
        location: typeof body.location === "string" ? body.location : "",
        board,
        source:
          body.source === "extension" || body.source === "imported" || body.source === "recommendation"
            ? body.source
            : "manual",
        job_url: typeof body.job_url === "string" ? body.job_url : "",
        external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : null,
        salary_range: typeof body.salary_range === "string" ? body.salary_range : "",
        status:
          body.status === "saved" || body.status === "applied" || body.status === "archived"
            ? body.status
            : "new",
        employment_type: typeof body.employment_type === "string" ? body.employment_type : "",
        job_description: jobDescription,
        match_score: insight.score,
        match_summary: insight.summary,
        matched_keywords: insight.matched_keywords,
        missing_keywords: insight.missing_keywords,
        application_id: typeof body.application_id === "string" ? body.application_id : null,
        created_at: now,
        updated_at: now,
      };
      demoOpportunityStore.set(opportunity.id, opportunity);
      return NextResponse.json(opportunity);
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;
    const { resumeText, profileKeywords } = await getResumeAndKeywords(supabase, user.id);
    const insight =
      typeof body.match_score === "number"
        ? {
            score: body.match_score,
            summary: typeof body.match_summary === "string" ? body.match_summary : "",
            matched_keywords: Array.isArray(body.matched_keywords) ? body.matched_keywords.map(String) : [],
            missing_keywords: Array.isArray(body.missing_keywords) ? body.missing_keywords.map(String) : [],
          }
        : computeMatchInsight({ jobDescription, resumeText, profileKeywords });

    const dedupeFilters = [];
    if (typeof body.job_url === "string" && body.job_url.trim()) {
      dedupeFilters.push(supabase.from("opportunities").select("*").eq("user_id", user.id).eq("job_url", body.job_url.trim()).maybeSingle());
    }
    if (typeof body.external_job_id === "string" && body.external_job_id.trim()) {
      dedupeFilters.push(
        supabase
          .from("opportunities")
          .select("*")
          .eq("user_id", user.id)
          .eq("external_job_id", body.external_job_id.trim())
          .maybeSingle()
      );
    }

    for (const pending of dedupeFilters) {
      const result = await pending;
      if (!result.error && result.data) {
        return NextResponse.json(result.data as Opportunity);
      }
    }

    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        user_id: user.id,
        company,
        role,
        location: typeof body.location === "string" ? body.location : "",
        board,
        source:
          body.source === "extension" || body.source === "imported" || body.source === "recommendation"
            ? body.source
            : "manual",
        job_url: typeof body.job_url === "string" ? body.job_url : "",
        external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : null,
        salary_range: typeof body.salary_range === "string" ? body.salary_range : "",
        status:
          body.status === "saved" || body.status === "applied" || body.status === "archived"
            ? body.status
            : "new",
        employment_type: typeof body.employment_type === "string" ? body.employment_type : "",
        job_description: jobDescription,
        match_score: insight.score,
        match_summary: insight.summary,
        matched_keywords: insight.matched_keywords,
        missing_keywords: insight.missing_keywords,
        application_id: typeof body.application_id === "string" ? body.application_id : null,
      })
      .select("*")
      .single();

    if (error) {
      if (isSchemaCompatError(error)) {
        const now = new Date().toISOString();
        const fallback: Opportunity = {
          id: crypto.randomUUID(),
          user_id: user.id,
          company,
          role,
          location: typeof body.location === "string" ? body.location : "",
          board,
          source:
            body.source === "extension" || body.source === "imported" || body.source === "recommendation"
              ? body.source
              : "manual",
          job_url: typeof body.job_url === "string" ? body.job_url : "",
          external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : null,
          salary_range: typeof body.salary_range === "string" ? body.salary_range : "",
          status:
            body.status === "saved" || body.status === "applied" || body.status === "archived"
              ? body.status
              : "new",
          employment_type: typeof body.employment_type === "string" ? body.employment_type : "",
          job_description: jobDescription,
          match_score: insight.score,
          match_summary: insight.summary,
          matched_keywords: insight.matched_keywords,
          missing_keywords: insight.missing_keywords,
          application_id: typeof body.application_id === "string" ? body.application_id : null,
          created_at: now,
          updated_at: now,
        };
        demoOpportunityStore.set(fallback.id, fallback);
        return NextResponse.json(fallback);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as Opportunity);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await ensureObjectBody(request);
    if (body instanceof NextResponse) return body;

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

    if (!isSupabaseConfigured) {
      const existing = demoOpportunityStore.get(id);
      if (!existing) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });

      const nextDescription =
        typeof body.job_description === "string" ? body.job_description.trim() : existing.job_description;
      const nextScore =
        typeof body.match_score === "number"
          ? body.match_score
          : computeMatchInsight({ jobDescription: nextDescription }).score;
      const nextInsight =
        typeof body.match_score === "number" && typeof body.match_summary === "string"
          ? {
              summary: body.match_summary,
              matched_keywords: Array.isArray(body.matched_keywords) ? body.matched_keywords.map(String) : existing.matched_keywords,
              missing_keywords: Array.isArray(body.missing_keywords) ? body.missing_keywords.map(String) : existing.missing_keywords,
            }
          : computeMatchInsight({ jobDescription: nextDescription });

      const updated: Opportunity = {
        ...existing,
        company: typeof body.company === "string" ? body.company : existing.company,
        role: typeof body.role === "string" ? body.role : existing.role,
        location: typeof body.location === "string" ? body.location : existing.location,
        board: typeof body.board === "string" ? body.board : existing.board,
        source:
          body.source === "extension" || body.source === "imported" || body.source === "recommendation" || body.source === "manual"
            ? body.source
            : existing.source,
        job_url: typeof body.job_url === "string" ? body.job_url : existing.job_url,
        external_job_id:
          typeof body.external_job_id === "string" ? body.external_job_id : existing.external_job_id,
        salary_range: typeof body.salary_range === "string" ? body.salary_range : existing.salary_range,
        status:
          body.status === "new" || body.status === "saved" || body.status === "applied" || body.status === "archived"
            ? body.status
            : existing.status,
        employment_type:
          typeof body.employment_type === "string" ? body.employment_type : existing.employment_type,
        job_description: nextDescription,
        match_score: nextScore,
        match_summary: nextInsight.summary,
        matched_keywords: nextInsight.matched_keywords,
        missing_keywords: nextInsight.missing_keywords,
        application_id: typeof body.application_id === "string" ? body.application_id : existing.application_id,
        updated_at: new Date().toISOString(),
      };
      demoOpportunityStore.set(id, updated);
      return NextResponse.json(updated);
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;
    const existingRes = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingRes.error) {
      if (isSchemaCompatError(existingRes.error)) {
        const existing = demoOpportunityStore.get(id);
        if (!existing) {
          return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
        }
        const nextDescription =
          typeof body.job_description === "string" ? body.job_description.trim() : existing.job_description;
        const fallbackInsight =
          typeof body.match_score === "number" && typeof body.match_summary === "string"
            ? {
                score: body.match_score,
                summary: body.match_summary,
                matched_keywords: Array.isArray(body.matched_keywords) ? body.matched_keywords.map(String) : existing.matched_keywords,
                missing_keywords: Array.isArray(body.missing_keywords) ? body.missing_keywords.map(String) : existing.missing_keywords,
              }
            : computeMatchInsight({ jobDescription: nextDescription });
        const updated: Opportunity = {
          ...existing,
          company: typeof body.company === "string" ? body.company : existing.company,
          role: typeof body.role === "string" ? body.role : existing.role,
          location: typeof body.location === "string" ? body.location : existing.location,
          board: typeof body.board === "string" ? body.board : existing.board,
          source:
            body.source === "extension" || body.source === "imported" || body.source === "recommendation" || body.source === "manual"
              ? body.source
              : existing.source,
          job_url: typeof body.job_url === "string" ? body.job_url : existing.job_url,
          external_job_id:
            typeof body.external_job_id === "string" ? body.external_job_id : existing.external_job_id,
          salary_range: typeof body.salary_range === "string" ? body.salary_range : existing.salary_range,
          status:
            body.status === "new" || body.status === "saved" || body.status === "applied" || body.status === "archived"
              ? body.status
              : existing.status,
          employment_type:
            typeof body.employment_type === "string" ? body.employment_type : existing.employment_type,
          job_description: nextDescription,
          match_score: fallbackInsight.score,
          match_summary: fallbackInsight.summary,
          matched_keywords: fallbackInsight.matched_keywords,
          missing_keywords: fallbackInsight.missing_keywords,
          application_id: typeof body.application_id === "string" ? body.application_id : existing.application_id,
          updated_at: new Date().toISOString(),
        };
        demoOpportunityStore.set(id, updated);
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: existingRes.error.message }, { status: 500 });
    }
    if (!existingRes.data) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const nextDescription =
      typeof body.job_description === "string" ? body.job_description.trim() : existingRes.data.job_description;
    const { resumeText, profileKeywords } = await getResumeAndKeywords(supabase, user.id);
    const insight =
      typeof body.match_score === "number"
        ? {
            score: body.match_score,
            summary: typeof body.match_summary === "string" ? body.match_summary : existingRes.data.match_summary,
            matched_keywords: Array.isArray(body.matched_keywords) ? body.matched_keywords.map(String) : existingRes.data.matched_keywords,
            missing_keywords: Array.isArray(body.missing_keywords) ? body.missing_keywords.map(String) : existingRes.data.missing_keywords,
          }
        : computeMatchInsight({ jobDescription: nextDescription, resumeText, profileKeywords });

    const { data, error } = await supabase
      .from("opportunities")
      .update({
        company: typeof body.company === "string" ? body.company : existingRes.data.company,
        role: typeof body.role === "string" ? body.role : existingRes.data.role,
        location: typeof body.location === "string" ? body.location : existingRes.data.location,
        board: typeof body.board === "string" ? body.board : existingRes.data.board,
        source:
          body.source === "extension" || body.source === "imported" || body.source === "recommendation"
            ? body.source
            : existingRes.data.source,
        job_url: typeof body.job_url === "string" ? body.job_url : existingRes.data.job_url,
        external_job_id:
          typeof body.external_job_id === "string" ? body.external_job_id : existingRes.data.external_job_id,
        salary_range: typeof body.salary_range === "string" ? body.salary_range : existingRes.data.salary_range,
        status:
          body.status === "new" || body.status === "saved" || body.status === "applied" || body.status === "archived"
            ? body.status
            : existingRes.data.status,
        employment_type:
          typeof body.employment_type === "string" ? body.employment_type : existingRes.data.employment_type,
        job_description: nextDescription,
        match_score: insight.score,
        match_summary: insight.summary,
        matched_keywords: insight.matched_keywords,
        missing_keywords: insight.missing_keywords,
        application_id: typeof body.application_id === "string" ? body.application_id : existingRes.data.application_id,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      if (isSchemaCompatError(error)) {
        const existing = demoOpportunityStore.get(id);
        if (!existing) {
          return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
        }
        const updated: Opportunity = {
          ...existing,
          company: typeof body.company === "string" ? body.company : existing.company,
          role: typeof body.role === "string" ? body.role : existing.role,
          location: typeof body.location === "string" ? body.location : existing.location,
          board: typeof body.board === "string" ? body.board : existing.board,
          source:
            body.source === "extension" || body.source === "imported" || body.source === "recommendation" || body.source === "manual"
              ? body.source
              : existing.source,
          job_url: typeof body.job_url === "string" ? body.job_url : existing.job_url,
          external_job_id:
            typeof body.external_job_id === "string" ? body.external_job_id : existing.external_job_id,
          salary_range: typeof body.salary_range === "string" ? body.salary_range : existing.salary_range,
          status:
            body.status === "new" || body.status === "saved" || body.status === "applied" || body.status === "archived"
              ? body.status
              : existing.status,
          employment_type:
            typeof body.employment_type === "string" ? body.employment_type : existing.employment_type,
          job_description: nextDescription,
          match_score: insight.score,
          match_summary: insight.summary,
          matched_keywords: insight.matched_keywords,
          missing_keywords: insight.missing_keywords,
          application_id: typeof body.application_id === "string" ? body.application_id : existing.application_id,
          updated_at: new Date().toISOString(),
        };
        demoOpportunityStore.set(id, updated);
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as Opportunity);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
