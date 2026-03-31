import { NextResponse } from "next/server";
import type { InterviewEvent } from "@/types/database";
import {
  addDemoTimelineEvent,
  demoInterviewStore,
} from "@/lib/services/career-os-demo";
import {
  ensureObjectBody,
  isSupabaseConfigured,
  withAuth,
} from "@/lib/server/route-utils";

const listDemoInterviews = (applicationId: string): InterviewEvent[] =>
  Array.from(demoInterviewStore.values())
    .filter((event) => event.application_id === applicationId)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

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
      return NextResponse.json(listDemoInterviews(applicationId));
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("interview_events")
      .select("*")
      .eq("user_id", user.id)
      .eq("application_id", applicationId)
      .order("scheduled_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []) as InterviewEvent[]);
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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const scheduledAt = typeof body.scheduled_at === "string" ? body.scheduled_at.trim() : "";
    if (!applicationId || !title || !scheduledAt) {
      return NextResponse.json(
        { error: "application_id, title, and scheduled_at are required." },
        { status: 400 }
      );
    }

    const interviewType =
      body.interview_type === "behavioral" ||
      body.interview_type === "technical" ||
      body.interview_type === "onsite" ||
      body.interview_type === "final" ||
      body.interview_type === "other"
        ? body.interview_type
        : "screen";

    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      const interview: InterviewEvent = {
        id: crypto.randomUUID(),
        user_id: "demo-user",
        application_id: applicationId,
        title,
        interview_type: interviewType,
        scheduled_at: scheduledAt,
        location: typeof body.location === "string" ? body.location : "",
        notes: typeof body.notes === "string" ? body.notes : "",
        created_at: now,
        updated_at: now,
      };
      demoInterviewStore.set(interview.id, interview);
      addDemoTimelineEvent({
        user_id: "demo-user",
        application_id: applicationId,
        event_type: "interview",
        title,
        description: `Interview scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
        occurred_at: now,
        metadata: null,
      });
      return NextResponse.json(interview);
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("interview_events")
      .insert({
        user_id: user.id,
        application_id: applicationId,
        title,
        interview_type: interviewType,
        scheduled_at: scheduledAt,
        location: typeof body.location === "string" ? body.location : "",
        notes: typeof body.notes === "string" ? body.notes : "",
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("application_timeline_events").insert({
      user_id: user.id,
      application_id: applicationId,
      event_type: "interview",
      title,
      description: `Interview scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
      occurred_at: new Date().toISOString(),
    });

    return NextResponse.json(data as InterviewEvent);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
