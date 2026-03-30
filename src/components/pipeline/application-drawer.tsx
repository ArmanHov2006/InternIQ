"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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

type FormState = Pick<
  Application,
  | "company"
  | "role"
  | "job_url"
  | "status"
  | "location"
  | "salary_range"
  | "notes"
  | "contact_name"
  | "contact_email"
  | "fit_analysis"
  | "generated_email"
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
  status: application.status,
  location: application.location ?? "",
  salary_range: application.salary_range ?? "",
  notes: application.notes ?? "",
  contact_name: application.contact_name ?? "",
  contact_email: application.contact_email ?? "",
  fit_analysis: application.fit_analysis ?? "",
  generated_email: application.generated_email ?? "",
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
  const [activityOpen, setActivityOpen] = useState(false);
  const [fitResult, setFitResult] = useState<AnalyzeResult | null>(null);

  useEffect(() => {
    if (!application) {
      setForm(null);
      setFitResult(null);
      return;
    }
    setForm(toFormState(application));
    setFitResult(parseSavedFitResult(application));
  }, [application]);

  const fitScoreLabel = useMemo(() => {
    if (!application?.fit_score && application?.fit_score !== 0) return null;
    return `${application.fit_score}/100`;
  }, [application?.fit_score]);

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
        className="flex w-full flex-col overflow-hidden border-l border-border p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle className="text-lg font-semibold">{application.company}</SheetTitle>
            <Badge variant="outline" className={cn("text-xs font-normal", STATUS_COLORS[application.status])}>
              {STATUS_LABELS[application.status]}
            </Badge>
            {fitScoreLabel ? (
              <Badge variant="secondary" className="text-xs">
                Fit {fitScoreLabel}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{application.role}</p>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2 rounded-md bg-muted/50 p-1">
            <TabsTrigger value="overview" className="text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-sm">
              AI
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden"
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-company">Company</Label>
                  <Input
                    id="drawer-company"
                    value={form.company}
                    onChange={(e) => setField("company", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-role">Role</Label>
                  <Input
                    id="drawer-role"
                    value={form.role}
                    onChange={(e) => setField("role", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="drawer-job-url">Job URL</Label>
                <Input
                  id="drawer-job-url"
                  value={form.job_url}
                  onChange={(e) => setField("job_url", e.target.value)}
                  className="h-9"
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setField("status", v as Application["status"])}
                  >
                    <SelectTrigger className="h-9">
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
                  <Label htmlFor="drawer-location">Location</Label>
                  <Input
                    id="drawer-location"
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-salary">Salary</Label>
                  <Input
                    id="drawer-salary"
                    value={form.salary_range}
                    onChange={(e) => setField("salary_range", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-contact-name">Contact</Label>
                  <Input
                    id="drawer-contact-name"
                    value={form.contact_name}
                    onChange={(e) => setField("contact_name", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-contact-email">Email</Label>
                  <Input
                    id="drawer-contact-email"
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setField("contact_email", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="drawer-notes">Notes</Label>
                <Textarea
                  id="drawer-notes"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  className="resize-none text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => setActivityOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/40"
              >
                <span>Activity</span>
                <ChevronDown className={cn("h-4 w-4 transition", activityOpen && "rotate-180")} />
              </button>
              {activityOpen ? (
                <div className="space-y-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <p>
                    Source: <span className="text-foreground">{application.last_status_change_source ?? "manual"}</span>
                  </p>
                  {application.last_status_change_at ? (
                    <p>Updated: {new Date(application.last_status_change_at).toLocaleString()}</p>
                  ) : null}
                  {application.last_status_change_reason ? (
                    <p>{application.last_status_change_reason}</p>
                  ) : null}
                </div>
              ) : null}

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
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
