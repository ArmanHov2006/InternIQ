import { NextResponse } from "next/server";
import type { ApplicationContact } from "@/types/database";
import {
  addDemoTimelineEvent,
  demoContactStore,
} from "@/lib/services/career-os-demo";
import {
  ensureObjectBody,
  isSupabaseConfigured,
  withAuth,
} from "@/lib/server/route-utils";
import { isSchemaCompatError } from "@/lib/server/schema-compat";

const listDemoContacts = (applicationId: string): ApplicationContact[] =>
  Array.from(demoContactStore.values())
    .filter((contact) => contact.application_id === applicationId)
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
      return NextResponse.json(listDemoContacts(applicationId));
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("application_contacts")
      .select("*")
      .eq("user_id", user.id)
      .eq("application_id", applicationId)
      .order("updated_at", { ascending: false });

    if (error) {
      if (isSchemaCompatError(error)) {
        return NextResponse.json(listDemoContacts(applicationId));
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json((data ?? []) as ApplicationContact[]);
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!applicationId || !name) {
      return NextResponse.json(
        { error: "application_id and name are required." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      const contact: ApplicationContact = {
        id: crypto.randomUUID(),
        user_id: "demo-user",
        application_id: applicationId,
        name,
        email: typeof body.email === "string" ? body.email : "",
        title: typeof body.title === "string" ? body.title : "",
        company: typeof body.company === "string" ? body.company : "",
        relationship_type:
          body.relationship_type === "referrer" ||
          body.relationship_type === "hiring_manager" ||
          body.relationship_type === "interviewer" ||
          body.relationship_type === "other"
            ? body.relationship_type
            : "recruiter",
        notes: typeof body.notes === "string" ? body.notes : "",
        last_contacted_at:
          typeof body.last_contacted_at === "string" ? body.last_contacted_at : null,
        next_follow_up_at:
          typeof body.next_follow_up_at === "string" ? body.next_follow_up_at : null,
        created_at: now,
        updated_at: now,
      };
      demoContactStore.set(contact.id, contact);
      addDemoTimelineEvent({
        user_id: "demo-user",
        application_id: applicationId,
        event_type: "contact",
        title: `Added contact: ${name}`,
        description: contact.title ? `${contact.title} added to relationship CRM.` : "Relationship contact added.",
        occurred_at: now,
        metadata: null,
      });
      return NextResponse.json(contact);
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("application_contacts")
      .insert({
        user_id: user.id,
        application_id: applicationId,
        name,
        email: typeof body.email === "string" ? body.email : "",
        title: typeof body.title === "string" ? body.title : "",
        company: typeof body.company === "string" ? body.company : "",
        relationship_type:
          body.relationship_type === "referrer" ||
          body.relationship_type === "hiring_manager" ||
          body.relationship_type === "interviewer" ||
          body.relationship_type === "other"
            ? body.relationship_type
            : "recruiter",
        notes: typeof body.notes === "string" ? body.notes : "",
        last_contacted_at:
          typeof body.last_contacted_at === "string" ? body.last_contacted_at : null,
        next_follow_up_at:
          typeof body.next_follow_up_at === "string" ? body.next_follow_up_at : null,
      })
      .select("*")
      .single();

    if (error) {
      if (isSchemaCompatError(error)) {
        const now = new Date().toISOString();
        const contact: ApplicationContact = {
          id: crypto.randomUUID(),
          user_id: user.id,
          application_id: applicationId,
          name,
          email: typeof body.email === "string" ? body.email : "",
          title: typeof body.title === "string" ? body.title : "",
          company: typeof body.company === "string" ? body.company : "",
          relationship_type:
            body.relationship_type === "referrer" ||
            body.relationship_type === "hiring_manager" ||
            body.relationship_type === "interviewer" ||
            body.relationship_type === "other"
              ? body.relationship_type
              : "recruiter",
          notes: typeof body.notes === "string" ? body.notes : "",
          last_contacted_at:
            typeof body.last_contacted_at === "string" ? body.last_contacted_at : null,
          next_follow_up_at:
            typeof body.next_follow_up_at === "string" ? body.next_follow_up_at : null,
          created_at: now,
          updated_at: now,
        };
        demoContactStore.set(contact.id, contact);
        addDemoTimelineEvent({
          user_id: user.id,
          application_id: applicationId,
          event_type: "contact",
          title: `Added contact: ${name}`,
          description: contact.title ? `${contact.title} added to relationship CRM.` : "Relationship contact added.",
          occurred_at: now,
          metadata: null,
        });
        return NextResponse.json(contact);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("application_timeline_events").insert({
      user_id: user.id,
      application_id: applicationId,
      event_type: "contact",
      title: `Added contact: ${name}`,
      description:
        typeof body.title === "string" && body.title.trim()
          ? `${body.title.trim()} added to relationship CRM.`
          : "Relationship contact added.",
      occurred_at: new Date().toISOString(),
    });

    return NextResponse.json(data as ApplicationContact);
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
      const existing = demoContactStore.get(id);
      if (!existing) return NextResponse.json({ error: "Contact not found." }, { status: 404 });

      const updated: ApplicationContact = {
        ...existing,
        name: typeof body.name === "string" ? body.name : existing.name,
        email: typeof body.email === "string" ? body.email : existing.email,
        title: typeof body.title === "string" ? body.title : existing.title,
        company: typeof body.company === "string" ? body.company : existing.company,
        relationship_type:
          body.relationship_type === "referrer" ||
          body.relationship_type === "hiring_manager" ||
          body.relationship_type === "interviewer" ||
          body.relationship_type === "other" ||
          body.relationship_type === "recruiter"
            ? body.relationship_type
            : existing.relationship_type,
        notes: typeof body.notes === "string" ? body.notes : existing.notes,
        last_contacted_at:
          typeof body.last_contacted_at === "string" ? body.last_contacted_at : existing.last_contacted_at,
        next_follow_up_at:
          typeof body.next_follow_up_at === "string" ? body.next_follow_up_at : existing.next_follow_up_at,
        updated_at: new Date().toISOString(),
      };
      demoContactStore.set(id, updated);
      return NextResponse.json(updated);
    }

    const auth = await withAuth();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("application_contacts")
      .update({
        name: typeof body.name === "string" ? body.name : undefined,
        email: typeof body.email === "string" ? body.email : undefined,
        title: typeof body.title === "string" ? body.title : undefined,
        company: typeof body.company === "string" ? body.company : undefined,
        relationship_type:
          body.relationship_type === "referrer" ||
          body.relationship_type === "hiring_manager" ||
          body.relationship_type === "interviewer" ||
          body.relationship_type === "other" ||
          body.relationship_type === "recruiter"
            ? body.relationship_type
            : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        last_contacted_at:
          typeof body.last_contacted_at === "string" ? body.last_contacted_at : undefined,
        next_follow_up_at:
          typeof body.next_follow_up_at === "string" ? body.next_follow_up_at : undefined,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      if (isSchemaCompatError(error)) {
        const existing = demoContactStore.get(id);
        if (!existing) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
        const updated: ApplicationContact = {
          ...existing,
          name: typeof body.name === "string" ? body.name : existing.name,
          email: typeof body.email === "string" ? body.email : existing.email,
          title: typeof body.title === "string" ? body.title : existing.title,
          company: typeof body.company === "string" ? body.company : existing.company,
          relationship_type:
            body.relationship_type === "referrer" ||
            body.relationship_type === "hiring_manager" ||
            body.relationship_type === "interviewer" ||
            body.relationship_type === "other" ||
            body.relationship_type === "recruiter"
              ? body.relationship_type
              : existing.relationship_type,
          notes: typeof body.notes === "string" ? body.notes : existing.notes,
          last_contacted_at:
            typeof body.last_contacted_at === "string" ? body.last_contacted_at : existing.last_contacted_at,
          next_follow_up_at:
            typeof body.next_follow_up_at === "string" ? body.next_follow_up_at : existing.next_follow_up_at,
          updated_at: new Date().toISOString(),
        };
        demoContactStore.set(id, updated);
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as ApplicationContact);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
