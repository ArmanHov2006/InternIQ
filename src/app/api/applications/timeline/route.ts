import { NextResponse } from "next/server";
import type { ApplicationTimelineEvent } from "@/types/database";
import {
  addDemoTimelineEvent,
  demoTimelineStore,
} from "@/lib/services/career-os-demo";
import {
  ensureObjectBody,
  isSupabaseConfigured,
  withAuth,
} from "@/lib/server/route-utils";
import { isSchemaCompatError } from "@/lib/server/schema-compat";

const listDemoTimeline = (applicationId: string): ApplicationTimelineEvent[] =>
  Array.from(demoTimelineStore.values())
    .filter((event) => event.application_id === applicationId)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

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
      return NextResponse.json(listDemoTimeline(applicationId));
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("application_timeline_events")
      .select("*")
      .eq("user_id", user.id)
      .eq("application_id", applicationId)
      .order("occurred_at", { ascending: false });

    if (error) {
      if (isSchemaCompatError(error)) {
        return NextResponse.json(listDemoTimeline(applicationId));
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json((data ?? []) as ApplicationTimelineEvent[]);
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
    if (!applicationId || !title) {
      return NextResponse.json(
        { error: "application_id and title are required." },
        { status: 400 }
      );
    }

    const eventType =
      body.event_type === "status_change" ||
      body.event_type === "contact" ||
      body.event_type === "interview" ||
      body.event_type === "artifact" ||
      body.event_type === "system"
        ? body.event_type
        : "note";
    const description = typeof body.description === "string" ? body.description : "";
    const occurredAt = typeof body.occurred_at === "string" ? body.occurred_at : new Date().toISOString();

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        addDemoTimelineEvent({
          user_id: "demo-user",
          application_id: applicationId,
          event_type: eventType,
          title,
          description,
          occurred_at: occurredAt,
          metadata:
            body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
              ? (body.metadata as Record<string, unknown>)
              : null,
        })
      );
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("application_timeline_events")
      .insert({
        user_id: user.id,
        application_id: applicationId,
        event_type: eventType,
        title,
        description,
        occurred_at: occurredAt,
        metadata:
          body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
            ? body.metadata
            : {},
      })
      .select("*")
      .single();

    if (error) {
      if (isSchemaCompatError(error)) {
        return NextResponse.json(
          addDemoTimelineEvent({
            user_id: user.id,
            application_id: applicationId,
            event_type: eventType,
            title,
            description,
            occurred_at: occurredAt,
            metadata:
              body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
                ? (body.metadata as Record<string, unknown>)
                : null,
          })
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as ApplicationTimelineEvent);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
