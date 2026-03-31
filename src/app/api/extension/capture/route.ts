import { NextResponse } from "next/server";
import type { Opportunity } from "@/types/database";
import {
  buildOpportunityDedupeKey,
  computeMatchInsight,
  inferBoardFromUrl,
} from "@/lib/services/career-os";
import { demoOpportunityStore } from "@/lib/services/career-os-demo";
import {
  ensureObjectBody,
  isSupabaseConfigured,
  withAuth,
} from "@/lib/server/route-utils";
import { isSchemaCompatError } from "@/lib/server/schema-compat";

export async function POST(request: Request) {
  try {
    const body = await ensureObjectBody(request);
    if (body instanceof NextResponse) return body;

    const company = typeof body.company === "string" ? body.company.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const jobUrl = typeof body.job_url === "string" ? body.job_url.trim() : "";
    const jobDescription =
      typeof body.job_description === "string" ? body.job_description.trim() : "";

    if (!company || !role) {
      return NextResponse.json(
        { error: "company and role are required." },
        { status: 400 }
      );
    }

    const dedupeKey = buildOpportunityDedupeKey({
      company,
      role,
      job_url: jobUrl,
      external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : "",
    });
    const insight = computeMatchInsight({ jobDescription });
    const board =
      typeof body.board === "string" && body.board.trim()
        ? body.board.trim()
        : inferBoardFromUrl(jobUrl);

    if (!isSupabaseConfigured) {
      const existing = Array.from(demoOpportunityStore.values()).find(
        (opportunity) => buildOpportunityDedupeKey(opportunity) === dedupeKey
      );
      if (existing) {
        const updated: Opportunity = {
          ...existing,
          board,
          job_url: jobUrl || existing.job_url,
          source: "extension",
          job_description: jobDescription || existing.job_description,
          match_score: insight.score,
          match_summary: insight.summary,
          matched_keywords: insight.matched_keywords,
          missing_keywords: insight.missing_keywords,
          updated_at: new Date().toISOString(),
        };
        demoOpportunityStore.set(updated.id, updated);
        return NextResponse.json(updated);
      }

      const now = new Date().toISOString();
      const created: Opportunity = {
        id: crypto.randomUUID(),
        user_id: "demo-user",
        company,
        role,
        location: typeof body.location === "string" ? body.location : "",
        board,
        source: "extension",
        job_url: jobUrl,
        external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : null,
        salary_range: typeof body.salary_range === "string" ? body.salary_range : "",
        status: "new",
        employment_type: typeof body.employment_type === "string" ? body.employment_type : "",
        job_description: jobDescription,
        match_score: insight.score,
        match_summary: insight.summary,
        matched_keywords: insight.matched_keywords,
        missing_keywords: insight.missing_keywords,
        application_id: null,
        created_at: now,
        updated_at: now,
      };
      demoOpportunityStore.set(created.id, created);
      return NextResponse.json(created);
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const existingRes = jobUrl
      ? await supabase
          .from("opportunities")
          .select("*")
          .eq("user_id", user.id)
          .eq("job_url", jobUrl)
          .maybeSingle()
      : { data: null, error: null };

    if (existingRes.error) {
      if (isSchemaCompatError(existingRes.error)) {
        const now = new Date().toISOString();
        const fallback: Opportunity = {
          id: crypto.randomUUID(),
          user_id: user.id,
          company,
          role,
          location: typeof body.location === "string" ? body.location : "",
          board,
          source: "extension",
          job_url: jobUrl,
          external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : null,
          salary_range: typeof body.salary_range === "string" ? body.salary_range : "",
          status: "new",
          employment_type: typeof body.employment_type === "string" ? body.employment_type : "",
          job_description: jobDescription,
          match_score: insight.score,
          match_summary: insight.summary,
          matched_keywords: insight.matched_keywords,
          missing_keywords: insight.missing_keywords,
          application_id: null,
          created_at: now,
          updated_at: now,
        };
        demoOpportunityStore.set(fallback.id, fallback);
        return NextResponse.json(fallback);
      }
      return NextResponse.json({ error: existingRes.error.message }, { status: 500 });
    }

    if (existingRes.data) {
      const { data, error } = await supabase
        .from("opportunities")
        .update({
          board,
          source: "extension",
          company,
          role,
          location: typeof body.location === "string" ? body.location : existingRes.data.location,
          employment_type:
            typeof body.employment_type === "string" ? body.employment_type : existingRes.data.employment_type,
          salary_range:
            typeof body.salary_range === "string" ? body.salary_range : existingRes.data.salary_range,
          external_job_id:
            typeof body.external_job_id === "string" ? body.external_job_id : existingRes.data.external_job_id,
          job_description: jobDescription || existingRes.data.job_description,
          match_score: insight.score,
          match_summary: insight.summary,
          matched_keywords: insight.matched_keywords,
          missing_keywords: insight.missing_keywords,
        })
        .eq("id", existingRes.data.id)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (error) {
        if (isSchemaCompatError(error)) {
          const updated: Opportunity = {
            ...(existingRes.data as Opportunity),
            board,
            job_url: jobUrl || existingRes.data.job_url,
            source: "extension",
            job_description: jobDescription || existingRes.data.job_description,
            match_score: insight.score,
            match_summary: insight.summary,
            matched_keywords: insight.matched_keywords,
            missing_keywords: insight.missing_keywords,
            updated_at: new Date().toISOString(),
          };
          demoOpportunityStore.set(updated.id, updated);
          return NextResponse.json(updated);
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data as Opportunity);
    }

    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        user_id: user.id,
        company,
        role,
        location: typeof body.location === "string" ? body.location : "",
        board,
        source: "extension",
        job_url: jobUrl,
        external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : null,
        salary_range: typeof body.salary_range === "string" ? body.salary_range : "",
        status: "new",
        employment_type: typeof body.employment_type === "string" ? body.employment_type : "",
        job_description: jobDescription,
        match_score: insight.score,
        match_summary: insight.summary,
        matched_keywords: insight.matched_keywords,
        missing_keywords: insight.missing_keywords,
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
          source: "extension",
          job_url: jobUrl,
          external_job_id: typeof body.external_job_id === "string" ? body.external_job_id : null,
          salary_range: typeof body.salary_range === "string" ? body.salary_range : "",
          status: "new",
          employment_type: typeof body.employment_type === "string" ? body.employment_type : "",
          job_description: jobDescription,
          match_score: insight.score,
          match_summary: insight.summary,
          matched_keywords: insight.matched_keywords,
          missing_keywords: insight.missing_keywords,
          application_id: null,
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
