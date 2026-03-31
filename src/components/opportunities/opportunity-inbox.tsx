"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, BriefcaseBusiness, ExternalLink, Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildPipelinePath } from "@/lib/navigation/dashboard-routes";
import { useKanbanStore } from "@/stores/kanban-store";
import type { Application, Opportunity } from "@/types/database";

type FormState = {
  company: string;
  role: string;
  job_url: string;
  job_description: string;
  location: string;
};

const defaultForm: FormState = {
  company: "",
  role: "",
  job_url: "",
  job_description: "",
  location: "",
};

export function OpportunityInbox() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const addOrUpdateFromApplication = useKanbanStore((state) => state.addOrUpdateFromApplication);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/opportunities", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as Opportunity[] | { error?: string };
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(Array.isArray(payload) ? "Could not load opportunities." : payload.error || "Could not load opportunities.");
      }
      setOpportunities(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load opportunities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const activeOpportunities = useMemo(
    () => opportunities.filter((opportunity) => opportunity.status !== "archived"),
    [opportunities]
  );

  const onCreateOpportunity = async () => {
    if (!form.company.trim() || !form.role.trim()) {
      toast.error("Company and role are required.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/opportunities", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as Opportunity | { error?: string };
      if (!response.ok || !("id" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Could not create opportunity.");
      }
      setOpportunities((current) => [payload as Opportunity, ...current.filter((item) => item.id !== payload.id)]);
      setForm(defaultForm);
      toast.success("Opportunity added to inbox.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create opportunity.");
    } finally {
      setSubmitting(false);
    }
  };

  const onCaptureWithExtension = async () => {
    setCapturing(true);
    try {
      const payload = {
        company: form.company || "Figma",
        role: form.role || "Product Designer",
        job_url: form.job_url || "https://www.figma.com/careers",
        job_description:
          form.job_description ||
          "Design polished product experiences, partner with product and engineering, and communicate systems thinking clearly.",
        location: form.location || "Remote",
      };
      const response = await fetch("/api/extension/capture", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as Opportunity | { error?: string };
      if (!response.ok || !("id" in data)) {
        throw new Error(("error" in data && data.error) || "Could not capture opportunity.");
      }
      setOpportunities((current) => [data as Opportunity, ...current.filter((item) => item.id !== data.id)]);
      toast.success("Opportunity captured via extension endpoint.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not capture opportunity.");
    } finally {
      setCapturing(false);
    }
  };

  const onArchive = async (opportunity: Opportunity) => {
    try {
      const response = await fetch("/api/opportunities", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id: opportunity.id, status: "archived" }),
      });
      const payload = (await response.json()) as Opportunity | { error?: string };
      if (!response.ok || !("id" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Could not archive opportunity.");
      }
      setOpportunities((current) => current.map((item) => (item.id === opportunity.id ? (payload as Opportunity) : item)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not archive opportunity.");
    }
  };

  const onSaveToPipeline = async (opportunity: Opportunity) => {
    setSavingId(opportunity.id);
    try {
      if (opportunity.application_id) {
        toast.success("Opportunity already linked to the pipeline.");
        return;
      }

      const createResponse = await fetch("/api/applications", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          company: opportunity.company,
          role: opportunity.role,
          status: "saved",
          location: opportunity.location,
          job_url: opportunity.job_url,
          job_description: opportunity.job_description,
          source: opportunity.source === "recommendation" ? "imported" : opportunity.source,
          board: opportunity.board,
          external_job_id: opportunity.external_job_id,
          match_score: opportunity.match_score,
          notes: opportunity.match_summary,
        }),
      });
      const createdApplication = (await createResponse.json()) as Application | { error?: string };
      if (!createResponse.ok || !("id" in createdApplication)) {
        throw new Error(
          ("error" in createdApplication && createdApplication.error) || "Could not create application."
        );
      }

      addOrUpdateFromApplication(createdApplication as Application);

      const updateResponse = await fetch("/api/opportunities", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          id: opportunity.id,
          status: "saved",
          application_id: createdApplication.id,
        }),
      });
      const updatedOpportunity = (await updateResponse.json()) as Opportunity | { error?: string };
      if (!updateResponse.ok || !("id" in updatedOpportunity)) {
        throw new Error(
          ("error" in updatedOpportunity && updatedOpportunity.error) || "Could not link opportunity."
        );
      }

      setOpportunities((current) =>
        current.map((item) => (item.id === opportunity.id ? (updatedOpportunity as Opportunity) : item))
      );
      toast.success("Opportunity sent to pipeline.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save opportunity.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6" tiltEnabled={false}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Job URL</Label>
              <Input
                placeholder="https://company.com/jobs/..."
                value={form.job_url}
                onChange={(event) => setForm((current) => ({ ...current, job_url: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Job description</Label>
              <Textarea
                rows={4}
                placeholder="Paste the job description to compute a match score."
                value={form.job_description}
                onChange={(event) => setForm((current) => ({ ...current, job_description: event.target.value }))}
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Button className="gap-2" onClick={() => void onCreateOpportunity()} disabled={submitting}>
              <Plus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add to inbox"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => void onCaptureWithExtension()} disabled={capturing}>
              <Wand2 className="h-4 w-4" />
              {capturing ? "Capturing..." : "Simulate extension capture"}
            </Button>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="p-6" tiltEnabled={false}>
          <p className="text-sm text-muted-foreground">Loading opportunities...</p>
        </GlassCard>
      ) : activeOpportunities.length === 0 ? (
        <EmptyState
          icon={<BriefcaseBusiness className="h-5 w-5" />}
          title="No opportunities yet"
          description="Capture a role manually or use the extension endpoint to seed your inbox."
          action={
            <Button variant="outline" className="gap-2" onClick={() => void onCaptureWithExtension()}>
              <Wand2 className="h-4 w-4" />
              Seed inbox
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {activeOpportunities.map((opportunity) => (
            <GlassCard key={opportunity.id} className="p-5" tiltEnabled={false}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{opportunity.company}</h2>
                    <Badge variant="outline">{opportunity.board}</Badge>
                    <Badge variant="secondary">{opportunity.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{opportunity.role}</p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-right">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Match</p>
                  <p className="text-lg font-semibold">{opportunity.match_score ?? "--"}%</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">{opportunity.match_summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {opportunity.matched_keywords.slice(0, 4).map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="bg-emerald-500/10 text-emerald-300">
                    {keyword}
                  </Badge>
                ))}
                {opportunity.missing_keywords.slice(0, 2).map((keyword) => (
                  <Badge key={keyword} variant="outline">
                    Missing: {keyword}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {opportunity.application_id ? (
                  <Button asChild size="sm" className="gap-2">
                    <Link href={buildPipelinePath(new URLSearchParams(), opportunity.application_id)}>
                      Open pipeline
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" className="gap-2" onClick={() => void onSaveToPipeline(opportunity)} disabled={savingId === opportunity.id}>
                    <Plus className="h-4 w-4" />
                    {savingId === opportunity.id ? "Saving..." : "Save to pipeline"}
                  </Button>
                )}
                {opportunity.job_url ? (
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <a href={opportunity.job_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open job
                    </a>
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => void onArchive(opportunity)}>
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
