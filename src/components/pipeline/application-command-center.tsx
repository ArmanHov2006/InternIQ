"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, History, Link2, MailPlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { parseProofPackArtifact } from "@/lib/services/career-os";
import type {
  Application,
  ApplicationArtifact,
  ApplicationContact,
  ApplicationTimelineEvent,
  InterviewEvent,
} from "@/types/database";

type Props = {
  application: Application;
};

type ContactForm = {
  name: string;
  email: string;
  title: string;
  relationship_type: "recruiter" | "referrer" | "hiring_manager" | "interviewer" | "other";
};

type InterviewForm = {
  title: string;
  scheduled_at: string;
  interview_type: "screen" | "behavioral" | "technical" | "onsite" | "final" | "other";
  location: string;
  notes: string;
};

const defaultContactForm: ContactForm = {
  name: "",
  email: "",
  title: "",
  relationship_type: "recruiter",
};

const defaultInterviewForm: InterviewForm = {
  title: "",
  scheduled_at: "",
  interview_type: "screen",
  location: "",
  notes: "",
};

export function ApplicationCommandCenter({ application }: Props) {
  const [contacts, setContacts] = useState<ApplicationContact[]>([]);
  const [interviews, setInterviews] = useState<InterviewEvent[]>([]);
  const [timeline, setTimeline] = useState<ApplicationTimelineEvent[]>([]);
  const [artifacts, setArtifacts] = useState<ApplicationArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState<ContactForm>(defaultContactForm);
  const [interviewForm, setInterviewForm] = useState<InterviewForm>(defaultInterviewForm);
  const [addingContact, setAddingContact] = useState(false);
  const [addingInterview, setAddingInterview] = useState(false);
  const [generatingProofPack, setGeneratingProofPack] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const query = `application_id=${application.id}`;
      const [contactRes, interviewRes, timelineRes, artifactRes] = await Promise.all([
        fetch(`/api/applications/contacts?${query}`, { credentials: "same-origin", headers: { Accept: "application/json" } }),
        fetch(`/api/applications/interviews?${query}`, { credentials: "same-origin", headers: { Accept: "application/json" } }),
        fetch(`/api/applications/timeline?${query}`, { credentials: "same-origin", headers: { Accept: "application/json" } }),
        fetch(`/api/applications/proof-pack?${query}`, { credentials: "same-origin", headers: { Accept: "application/json" } }),
      ]);

      const [contactPayload, interviewPayload, timelinePayload, artifactPayload] = await Promise.all([
        contactRes.json(),
        interviewRes.json(),
        timelineRes.json(),
        artifactRes.json(),
      ]);

      if (!contactRes.ok || !Array.isArray(contactPayload)) {
        throw new Error((contactPayload as { error?: string }).error || "Could not load contacts.");
      }
      if (!interviewRes.ok || !Array.isArray(interviewPayload)) {
        throw new Error((interviewPayload as { error?: string }).error || "Could not load interviews.");
      }
      if (!timelineRes.ok || !Array.isArray(timelinePayload)) {
        throw new Error((timelinePayload as { error?: string }).error || "Could not load timeline.");
      }
      if (!artifactRes.ok || !Array.isArray(artifactPayload)) {
        throw new Error((artifactPayload as { error?: string }).error || "Could not load proof packs.");
      }

      setContacts(contactPayload as ApplicationContact[]);
      setInterviews(interviewPayload as InterviewEvent[]);
      setTimeline(timelinePayload as ApplicationTimelineEvent[]);
      setArtifacts(artifactPayload as ApplicationArtifact[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load command center.");
    } finally {
      setLoading(false);
    }
  }, [application.id]);

  useEffect(() => {
    void refresh();
    setContactForm(defaultContactForm);
    setInterviewForm(defaultInterviewForm);
  }, [application.id, refresh]);

  const latestProofPack = useMemo(
    () => artifacts.find((artifact) => artifact.artifact_type === "proof_pack") ?? null,
    [artifacts]
  );
  const parsedProofPack = useMemo(() => parseProofPackArtifact(latestProofPack), [latestProofPack]);

  const addContact = async () => {
    if (!contactForm.name.trim()) {
      toast.error("Contact name is required.");
      return;
    }
    setAddingContact(true);
    try {
      const response = await fetch("/api/applications/contacts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          application_id: application.id,
          company: application.company,
          ...contactForm,
        }),
      });
      const payload = (await response.json()) as ApplicationContact | { error?: string };
      if (!response.ok || !("id" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Could not add contact.");
      }
      setContacts((current) => [payload as ApplicationContact, ...current]);
      setTimeline((current) => [
        {
          id: `temp-${(payload as ApplicationContact).id}`,
          user_id: application.user_id,
          application_id: application.id,
          event_type: "contact",
          title: `Added contact: ${(payload as ApplicationContact).name}`,
          description: "Relationship contact added.",
          occurred_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          metadata: null,
        },
        ...current,
      ]);
      setContactForm(defaultContactForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add contact.");
    } finally {
      setAddingContact(false);
    }
  };

  const addInterview = async () => {
    if (!interviewForm.title.trim() || !interviewForm.scheduled_at) {
      toast.error("Interview title and time are required.");
      return;
    }
    setAddingInterview(true);
    try {
      const response = await fetch("/api/applications/interviews", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          application_id: application.id,
          ...interviewForm,
        }),
      });
      const payload = (await response.json()) as InterviewEvent | { error?: string };
      if (!response.ok || !("id" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Could not add interview.");
      }
      setInterviews((current) =>
        [...current, payload as InterviewEvent].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )
      );
      setInterviewForm(defaultInterviewForm);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add interview.");
    } finally {
      setAddingInterview(false);
    }
  };

  const generateProofPack = async () => {
    setGeneratingProofPack(true);
    try {
      const response = await fetch("/api/applications/proof-pack", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ application_id: application.id }),
      });
      const payload = (await response.json()) as { artifact?: ApplicationArtifact; error?: string };
      if (!response.ok || !payload.artifact) {
        throw new Error(payload.error || "Could not generate proof pack.");
      }
      await refresh();
      toast.success("Proof pack generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate proof pack.");
    } finally {
      setGeneratingProofPack(false);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <GlassCard className="p-4" tiltEnabled={false}>
          <p className="text-sm text-muted-foreground">Loading command center...</p>
        </GlassCard>
      ) : null}

      <GlassCard className="p-4" tiltEnabled={false}>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Timeline</h3>
        </div>
        {timeline.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No timeline events yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {timeline.slice(0, 8).map((event) => (
              <li key={event.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  <Badge variant="outline">{event.event_type}</Badge>
                </div>
                {event.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                ) : null}
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {new Date(event.occurred_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard className="p-4" tiltEnabled={false}>
        <div className="flex items-center gap-2">
          <MailPlus className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Relationship CRM</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={contactForm.name} onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={contactForm.email} onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={contactForm.title} onChange={(event) => setContactForm((current) => ({ ...current, title: event.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Relationship</Label>
            <Select value={contactForm.relationship_type} onValueChange={(value) => setContactForm((current) => ({ ...current, relationship_type: value as ContactForm["relationship_type"] }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="referrer">Referrer</SelectItem>
                <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                <SelectItem value="interviewer">Interviewer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="mt-4" size="sm" onClick={() => void addContact()} disabled={addingContact}>
          {addingContact ? "Adding..." : "Add contact"}
        </Button>

        {contacts.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {contacts.map((contact) => (
              <li key={contact.id} className="rounded-xl border border-border bg-card px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[contact.title, contact.email].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                  <Badge variant="outline">{contact.relationship_type}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </GlassCard>

      <GlassCard className="p-4" tiltEnabled={false}>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Interview loop</h3>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="space-y-1.5">
            <Label>Interview title</Label>
            <Input value={interviewForm.title} onChange={(event) => setInterviewForm((current) => ({ ...current, title: event.target.value }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Scheduled time</Label>
              <Input type="datetime-local" value={interviewForm.scheduled_at} onChange={(event) => setInterviewForm((current) => ({ ...current, scheduled_at: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Interview type</Label>
              <Select value={interviewForm.interview_type} onValueChange={(value) => setInterviewForm((current) => ({ ...current, interview_type: value as InterviewForm["interview_type"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screen">Screen</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={interviewForm.location} onChange={(event) => setInterviewForm((current) => ({ ...current, location: event.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Prep notes</Label>
            <Textarea rows={3} value={interviewForm.notes} onChange={(event) => setInterviewForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
        </div>
        <Button className="mt-4" size="sm" onClick={() => void addInterview()} disabled={addingInterview}>
          {addingInterview ? "Scheduling..." : "Add interview event"}
        </Button>

        {interviews.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {interviews.map((interview) => (
              <li key={interview.id} className="rounded-xl border border-border bg-card px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{interview.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {new Date(interview.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{interview.interview_type}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </GlassCard>

      <GlassCard className={cn("p-4", generatingProofPack && "animate-glow-pulse shadow-glow-xs")} tiltEnabled={false}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Proof pack</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Generate a shareable role-specific recruiter pack from your current application and profile data.
        </p>
        <Button className="mt-4 gap-2" size="sm" onClick={() => void generateProofPack()} disabled={generatingProofPack}>
          <Sparkles className="h-4 w-4" />
          {generatingProofPack ? "Generating..." : latestProofPack ? "Regenerate proof pack" : "Generate proof pack"}
        </Button>

        {parsedProofPack ? (
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Recruiter ready</Badge>
              {latestProofPack?.share_slug ? (
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link href={`/apply/${latestProofPack.share_slug}`} target="_blank">
                    <Link2 className="h-4 w-4" />
                    Open share page
                  </Link>
                </Button>
              ) : null}
            </div>
            {parsedProofPack.recruiterNote ? (
              <Textarea readOnly rows={8} value={parsedProofPack.recruiterNote} className="text-xs" />
            ) : null}
            {parsedProofPack.evidenceBullets?.length ? (
              <ul className="space-y-2 text-xs text-muted-foreground">
                {parsedProofPack.evidenceBullets.map((bullet) => (
                  <li key={bullet} className="rounded-lg border border-border px-3 py-2">
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
