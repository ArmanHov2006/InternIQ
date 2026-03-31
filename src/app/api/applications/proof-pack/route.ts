import { NextResponse } from "next/server";
import type {
  Application,
  ApplicationArtifact,
  ApplicationContact,
  Experience,
  Profile,
  Project,
  Resume,
  ResumeVersion,
} from "@/types/database";
import { buildProofPack, computeMatchInsight } from "@/lib/services/career-os";
import {
  addDemoTimelineEvent,
  demoArtifactStore,
  demoContactStore,
} from "@/lib/services/career-os-demo";
import {
  ensureObjectBody,
  isSupabaseConfigured,
  withAuth,
} from "@/lib/server/route-utils";

const listDemoArtifacts = (applicationId: string): ApplicationArtifact[] =>
  Array.from(demoArtifactStore.values())
    .filter((artifact) => artifact.application_id === applicationId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("application_id")?.trim();
    if (!applicationId) {
      return NextResponse.json(
        { error: "application_id is required." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json(listDemoArtifacts(applicationId));
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("application_artifacts")
      .select("*")
      .eq("user_id", user.id)
      .eq("application_id", applicationId)
      .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []) as ApplicationArtifact[]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await ensureObjectBody(request);
    if (body instanceof NextResponse) return body;

    const applicationId = typeof body.application_id === "string" ? body.application_id.trim() : "";
    if (!applicationId) {
      return NextResponse.json(
        { error: "application_id is required." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      const demoApplication: Application = {
        id: applicationId,
        user_id: "demo-user",
        company: applicationId === "demo-2" ? "Stripe" : "Vercel",
        role: applicationId === "demo-2" ? "Backend Intern" : "Software Engineer Intern",
        job_url: "",
        job_description: "Build product and engineering experiences with modern web tooling.",
        status: applicationId === "demo-2" ? "interview" : "applied",
        source: "manual",
        board: "Manual",
        external_job_id: "",
        applied_date: new Date().toISOString().slice(0, 10),
        salary_range: "",
        location: "Remote",
        notes: "",
        fit_score: null,
        match_score: 84,
        fit_analysis: "",
        contact_name: "",
        contact_email: "",
        generated_email: "",
        next_action_at: null,
        last_contacted_at: null,
        resume_version_id: null,
        display_order: 0,
        last_status_change_source: "manual",
        last_status_change_reason: "",
        last_status_change_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ai_metadata: {},
      };
      const proofPack = buildProofPack({
        application: demoApplication,
        profile: null,
        projects: [],
        experience: [],
        resume: null,
        contacts: Array.from(demoContactStore.values()).filter((contact) => contact.application_id === applicationId),
      });
      const now = new Date().toISOString();
      const artifact: ApplicationArtifact = {
        id: crypto.randomUUID(),
        user_id: "demo-user",
        application_id: applicationId,
        artifact_type: "proof_pack",
        title: proofPack.artifactTitle,
        content: proofPack.packContent,
        share_slug: `${proofPack.shareSlug}-${applicationId}`,
        created_at: now,
        updated_at: now,
      };
      demoArtifactStore.set(artifact.id, artifact);
      addDemoTimelineEvent({
        user_id: "demo-user",
        application_id: applicationId,
        event_type: "artifact",
        title: "Proof pack generated",
        description: "Role-specific recruiter assets were generated.",
        occurred_at: now,
        metadata: null,
      });
      return NextResponse.json({ artifact, resumeVersion: null });
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const [applicationRes, profileRes, projectRes, experienceRes, resumeRes, contactRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .single(),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("projects").select("*").eq("user_id", user.id).order("display_order", { ascending: true }),
      supabase.from("experience").select("*").eq("user_id", user.id).order("display_order", { ascending: true }),
      supabase.from("resumes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("application_contacts")
        .select("*")
        .eq("user_id", user.id)
        .eq("application_id", applicationId)
        .order("updated_at", { ascending: false }),
    ]);

    if (applicationRes.error) return NextResponse.json({ error: applicationRes.error.message }, { status: 500 });
    if (profileRes.error) return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
    if (projectRes.error) return NextResponse.json({ error: projectRes.error.message }, { status: 500 });
    if (experienceRes.error) return NextResponse.json({ error: experienceRes.error.message }, { status: 500 });
    if (resumeRes.error) return NextResponse.json({ error: resumeRes.error.message }, { status: 500 });
    if (contactRes.error) return NextResponse.json({ error: contactRes.error.message }, { status: 500 });

    const application = applicationRes.data as Application;
    const profile = (profileRes.data ?? null) as Profile | null;
    const projects = (projectRes.data ?? []) as Project[];
    const experience = (experienceRes.data ?? []) as Experience[];
    const contacts = (contactRes.data ?? []) as ApplicationContact[];
    const resumes = (resumeRes.data ?? []) as Resume[];
    const primaryResume =
      resumes.find((resume) => resume.is_primary) ?? resumes.find((resume) => resume.parsed_text?.trim()) ?? null;
    const insight = computeMatchInsight({
      jobDescription: application.job_description ?? "",
      resumeText: primaryResume?.parsed_text ?? "",
      profileKeywords: projects.flatMap((project) => project.tech_stack ?? []),
    });
    const proofPack = buildProofPack({
      application,
      profile,
      projects,
      experience,
      resume: primaryResume,
      contacts,
    });

    const resumeVersionInsert = await supabase
      .from("resume_versions")
      .insert({
        user_id: user.id,
        application_id: application.id,
        resume_id: primaryResume?.id ?? null,
        label: `${application.company} tailored resume`,
        summary: proofPack.valueNarrative,
        keyword_coverage: insight.score,
        targeted_keywords: [...insight.matched_keywords, ...insight.missing_keywords].slice(0, 8),
      })
      .select("*")
      .single();

    if (resumeVersionInsert.error) {
      return NextResponse.json({ error: resumeVersionInsert.error.message }, { status: 500 });
    }

    const artifactInsert = await supabase
      .from("application_artifacts")
      .insert({
        user_id: user.id,
        application_id: application.id,
        artifact_type: "proof_pack",
        title: proofPack.artifactTitle,
        content: proofPack.packContent,
        share_slug: proofPack.shareSlug,
      })
      .select("*")
      .single();

    if (artifactInsert.error) {
      return NextResponse.json({ error: artifactInsert.error.message }, { status: 500 });
    }

    await Promise.all([
      supabase
        .from("applications")
        .update({ resume_version_id: resumeVersionInsert.data.id })
        .eq("id", application.id)
        .eq("user_id", user.id),
      supabase.from("application_timeline_events").insert({
        user_id: user.id,
        application_id: application.id,
        event_type: "artifact",
        title: "Proof pack generated",
        description: "Role-specific recruiter assets were generated.",
        occurred_at: new Date().toISOString(),
      }),
    ]);

    return NextResponse.json({
      artifact: artifactInsert.data as ApplicationArtifact,
      resumeVersion: resumeVersionInsert.data as ResumeVersion,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
