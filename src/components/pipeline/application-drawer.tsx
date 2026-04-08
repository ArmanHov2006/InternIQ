"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { APPLICATION_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import type { Application } from "@/types/database";
import { cn } from "@/lib/utils";
import type { AnalyzeResult } from "@/components/ai/fit-score-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ApplicationAiPanels } from "@/components/pipeline/application-ai-panels";
import { ApplicationCommandCenter } from "@/components/pipeline/application-command-center";

type FormState = Pick<
  Application,
  | "company"
  | "role"
  | "job_url"
  | "job_description"
  | "status"
  | "source"
  | "board"
  | "location"
  | "salary_range"
  | "notes"
  | "contact_name"
  | "contact_email"
  | "fit_analysis"
  | "generated_email"
  | "next_action_at"
  | "display_order"
>;

const parseApiError = (payload: unknown, fallback: string): string => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof (payload as { detail: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }
  return fallback;
};

const parseSavedFitResult = (application: Application): AnalyzeResult | null => {
  if (application.fit_score === null && !application.fit_analysis?.trim()) {
    return null;
  }
  const fallbackScore = application.fit_score ?? 0;
  const rawAnalysis = application.fit_analysis?.trim();
  if (!rawAnalysis) {
    return {
      fit_score: fallbackScore,
      analysis: { strengths: [], gaps: [], suggestions: [], summary: "" },
    };
  }
  try {
    const parsed = JSON.parse(rawAnalysis) as AnalyzeResult["analysis"];
    return {
      fit_score: fallbackScore,
      analysis: {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
      },
    };
  } catch {
    return {
      fit_score: fallbackScore,
      analysis: {
        strengths: [],
        gaps: [],
        suggestions: [],
        summary: rawAnalysis,
      },
    };
  }
};

const toFormState = (application: Application): FormState => ({
  company: application.company ?? "",
  role: application.role ?? "",
  job_url: application.job_url ?? "",
  job_description: application.job_description ?? "",
  status: application.status,
  source: application.source ?? "manual",
  board: application.board ?? "",
  location: application.location ?? "",
  salary_range: application.salary_range ?? "",
  notes: application.notes ?? "",
  contact_name: application.contact_name ?? "",
  contact_email: application.contact_email ?? "",
  fit_analysis: application.fit_analysis ?? "",
  generated_email: application.generated_email ?? "",
  next_action_at: application.next_action_at ?? "",
  display_order: application.display_order ?? 0,
});

export type ApplicationDrawerProps = {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (application: Application) => void;
  onDeleted: (id: string) => void;
};

export function ApplicationDrawer({
  application,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: ApplicationDrawerProps) {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fitResult, setFitResult] = useState<AnalyzeResult | null>(null);
  const [draftAnswers, setDraftAnswers] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const aiCompletion = useMemo(() => {
    if (!application) return [];
    const meta = application.ai_metadata as Record<string, unknown> | null | undefined;
    return [
      { label: "Analyze fit", done: typeof application.fit_score === "number" },
      { label: "Cold email", done: Boolean(application.generated_email?.trim()) },
      { label: "Cover letter", done: Boolean(meta?.coverLetter) },
      { label: "Interview prep", done: Boolean(meta?.interviewPrep) },
      { label: "Resume tailor", done: Boolean(meta?.resumeTailor) },
    ];
  }, [application]);


  useEffect(() => {
    if (!application) {
      setForm(null);
      setFitResult(null);
      setDraftAnswers(null);
      return;
    }
    setForm(toFormState(application));
    setFitResult(parseSavedFitResult(application));
  }, [application]);

  useEffect(() => {
    if (!application?.id || !open) return;
    let cancelled = false;
    setDraftLoading(true);
    fetch(
      `/api/applications/draft-answers?application_id=${encodeURIComponent(application.id)}`,
      { credentials: "same-origin" }
    )
      .then((r) => r.json())
      .then((data: { content?: string } | null) => {
        if (cancelled) return;
        setDraftAnswers(typeof data?.content === "string" ? data.content : null);
      })
      .catch(() => {
        if (!cancelled) setDraftAnswers(null);
      })
      .finally(() => {
        if (!cancelled) setDraftLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [application?.id, open]);

  const fitScoreLabel = useMemo(() => {
    if (!application?.fit_score && application?.fit_score !== 0) return null;
    return `${application.fit_score}/100`;
  }, [application?.fit_score]);
  const matchScoreLabel = useMemo(() => {
    if (!application?.match_score && application?.match_score !== 0) return null;
    return `${application.match_score}/100`;
  }, [application?.match_score]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const patchApplication = async (
    patch: Record<string, unknown>,
    fallbackError: string
  ): Promise<Application> => {
    if (!application) throw new Error("No application");
    const res = await fetch("/api/applications", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id: application.id, ...patch }),
    });
    const payload = (await res.json()) as Application | { error?: string; detail?: string };
    if (!res.ok) throw new Error(parseApiError(payload, fallbackError));
    const updated = payload as Application;
    onUpdated(updated);
    setForm(toFormState(updated));
    setFitResult(parseSavedFitResult(updated));
    return updated;
  };

  useEffect(() => {
    if (!open || !application?.id || !form) return;
    const timer = window.setTimeout(async () => {
      if ((application.notes ?? "") === form.notes) return;
      try {
        await patchApplication({ notes: form.notes }, "Could not save notes.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save notes.");
      }
    }, 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced notes autosave; omit patchApplication/application.notes to avoid loops
  }, [application?.id, form?.notes, open]);

  const handleSave = async () => {
    if (!application || !form) return;
    if (!form.company.trim() || !form.role.trim()) {
      toast.error("Company and role are required.");
      return;
    }
    setSaving(true);
    try {
      await patchApplication(
        {
          company: form.company.trim(),
          role: form.role.trim(),
          job_url: form.job_url,
          status: form.status,
          location: form.location,
          salary_range: form.salary_range,
          notes: form.notes,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          fit_analysis: form.fit_analysis,
          generated_email: form.generated_email,
          job_description: form.job_description,
          source: form.source,
          board: form.board,
          next_action_at: form.next_action_at || null,
        },
        "Could not update application."
      );
      toast.success("Saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;
    if (!window.confirm("Delete this application?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id: application.id }),
      });
      const payload = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !payload.success) throw new Error(payload.error ?? "Could not delete.");
      onDeleted(application.id);
      onOpenChange(false);
      toast.success("Deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setDeleting(false);
    }
  };

  if (!application || !form) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        onCloseAutoFocus={(event) => {
          // Prevent Radix from auto-focusing the previously active card, which can yank the board scroll position.
          event.preventDefault();
        }}
        overlayClassName="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        className="flex w-full flex-col overflow-hidden border-l border-border bg-drawer-surface p-0 shadow-none sm:max-w-2xl data-[state=closed]:duration-300 data-[state=open]:duration-500"
      >
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle className="text-xl font-bold sm:text-2xl">{application.company}</SheetTitle>
            <Badge variant="outline" className={cn("text-xs font-normal", STATUS_COLORS[application.status])}>
              {STATUS_LABELS[application.status]}
            </Badge>
            {fitScoreLabel ? (
              <Badge variant="secondary" className="text-xs">
                Fit {fitScoreLabel}
              </Badge>
            ) : null}
            {matchScoreLabel ? (
              <Badge variant="secondary" className="text-xs">
                Match {matchScoreLabel}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{application.role}</p>
        </SheetHeader>

        <Tabs defaultValue="ai" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-0 mt-0 flex h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="ai"
              className="relative flex-1 rounded-none border-b-2 border-transparent py-3 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              AI Actions
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="relative flex-1 rounded-none border-b-2 border-transparent py-3 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="relative flex-1 rounded-none border-b-2 border-transparent py-3 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="relative flex-1 rounded-none border-b-2 border-transparent py-3 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="drafts"
              className="relative flex-1 rounded-none border-b-2 border-transparent py-3 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Draft Answers
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden"
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-company" className="text-xs font-medium text-muted-foreground">
                    Company
                  </Label>
                  <Input
                    id="drawer-company"
                    value={form.company}
                    onChange={(e) => setField("company", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-role" className="text-xs font-medium text-muted-foreground">
                    Role
                  </Label>
                  <Input
                    id="drawer-role"
                    value={form.role}
                    onChange={(e) => setField("role", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="drawer-job-url" className="text-xs font-medium text-muted-foreground">
                  Job URL
                </Label>
                <Input
                  id="drawer-job-url"
                  value={form.job_url}
                  onChange={(e) => setField("job_url", e.target.value)}
                  className="h-10"
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-source" className="text-xs font-medium text-muted-foreground">
                    Source
                  </Label>
                  <Select
                    value={form.source ?? "manual"}
                    onValueChange={(value) => setField("source", value as FormState["source"])}
                  >
                    <SelectTrigger id="drawer-source" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="extension">Extension</SelectItem>
                      <SelectItem value="imported">Imported</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-board" className="text-xs font-medium text-muted-foreground">
                    Board
                  </Label>
                  <Input
                    id="drawer-board"
                    value={form.board ?? ""}
                    onChange={(e) => setField("board", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-next-action" className="text-xs font-medium text-muted-foreground">
                    Next action
                  </Label>
                  <Input
                    id="drawer-next-action"
                    type="datetime-local"
                    value={form.next_action_at ? String(form.next_action_at).slice(0, 16) : ""}
                    onChange={(e) => setField("next_action_at", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setField("status", v as Application["status"])}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-location" className="text-xs font-medium text-muted-foreground">
                    Location
                  </Label>
                  <Input
                    id="drawer-location"
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-salary" className="text-xs font-medium text-muted-foreground">
                    Salary
                  </Label>
                  <Input
                    id="drawer-salary"
                    value={form.salary_range}
                    onChange={(e) => setField("salary_range", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-contact-name" className="text-xs font-medium text-muted-foreground">
                    Contact
                  </Label>
                  <Input
                    id="drawer-contact-name"
                    value={form.contact_name}
                    onChange={(e) => setField("contact_name", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-contact-email" className="text-xs font-medium text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="drawer-contact-email"
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setField("contact_email", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="drawer-job-description" className="text-xs font-medium text-muted-foreground">
                  Job description
                </Label>
                <Textarea
                  id="drawer-job-description"
                  rows={5}
                  value={form.job_description ?? ""}
                  onChange={(e) => setField("job_description", e.target.value)}
                  className="resize-none rounded-lg border-border bg-input text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving || deleting}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="ml-auto"
                  onClick={() => void handleDelete()}
                  disabled={deleting || saving}
                >
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Delete
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="notes"
            className="mt-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden"
          >
            <div className="space-y-2">
              <Label htmlFor="drawer-notes-tab" className="text-xs font-medium text-muted-foreground">
                Notes
              </Label>
              <p className="text-xs text-muted-foreground">Autosaves after you pause typing.</p>
              <Textarea
                id="drawer-notes-tab"
                rows={12}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className="resize-none rounded-lg border-border bg-input text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent
            value="ai"
            className="mt-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden"
          >
            <ApplicationAiPanels
              application={application}
              form={form}
              fitResult={fitResult}
              setFitResult={setFitResult}
              onPatch={patchApplication}
            />
          </TabsContent>

          <TabsContent
            value="timeline"
            className="mt-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden"
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 text-sm">
                <p className="font-medium text-foreground">Status activity</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Source: <span className="text-foreground">{application.last_status_change_source ?? "manual"}</span>
                </p>
                {application.last_status_change_at ? (
                  <p className="text-xs text-muted-foreground">
                    Updated: {new Date(application.last_status_change_at).toLocaleString()}
                  </p>
                ) : null}
                {application.last_status_change_reason ? (
                  <p className="mt-2 text-xs text-muted-foreground">{application.last_status_change_reason}</p>
                ) : null}
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-medium text-foreground">AI actions</p>
                <ul className="mt-2 space-y-2">
                  {aiCompletion.map((item) => (
                    <li key={item.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5",
                          item.done ? "border-primary/40 text-foreground" : "border-border text-muted-foreground"
                        )}
                      >
                        {item.done ? "Completed" : "Pending"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <ApplicationCommandCenter application={application} />
            </div>
          </TabsContent>

          <TabsContent
            value="drafts"
            className="mt-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden"
          >
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Generated for external application forms. Copy sections into the employer site — nothing is submitted
                automatically.
              </p>
              {draftLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading…
                </div>
              ) : draftAnswers ? (
                <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                  {draftAnswers}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No draft answers yet. Use Smart Apply from Discover to generate them.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
