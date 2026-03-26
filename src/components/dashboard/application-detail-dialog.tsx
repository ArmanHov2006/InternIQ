"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Loader2, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  type ApplicationStatus,
} from "@/lib/constants";
import { celebrateOffer } from "@/lib/confetti";
import { createClient } from "@/lib/supabase/client";
import type { Application, Resume } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  friendlyTimeAgo,
  getSourceBadge,
  parseSuggestedStatusFromEvidence,
} from "@/lib/status-automation-ui";
import { FitScoreDisplay, type AnalyzeResult } from "@/components/ai/fit-score-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type ApplicationDetailDialogProps = {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (application: Application) => void;
  onDeleted: (id: string) => void;
};

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

type GeneratedEmailResult = {
  subject: string;
  body: string;
};

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
      analysis: {
        strengths: [],
        gaps: [],
        suggestions: [],
        summary: "",
      },
    };
  }

  try {
    const parsed = JSON.parse(rawAnalysis) as AnalyzeResult["analysis"];
    return {
      fit_score: fallbackScore,
      analysis: {
        strengths: Array.isArray(parsed.strengths)
          ? parsed.strengths.map((value) => String(value))
          : [],
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map((value) => String(value)) : [],
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions.map((value) => String(value))
          : [],
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

const splitSavedEmail = (generatedEmail: string): { subject: string; body: string } => {
  const trimmed = generatedEmail.trim();
  if (!trimmed) return { subject: "", body: "" };

  const match = trimmed.match(/^Subject:\s*(.+)\n\n([\s\S]*)$/i);
  if (match) {
    return {
      subject: match[1]?.trim() ?? "",
      body: match[2]?.trim() ?? "",
    };
  }

  return { subject: "", body: trimmed };
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

export function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: ApplicationDetailDialogProps) {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analyzingFit, setAnalyzingFit] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
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
  const sourceBadge = useMemo(
    () => (application ? getSourceBadge(application) : null),
    [application]
  );
  const suggestedTarget = useMemo(
    () => parseSuggestedStatusFromEvidence(application?.status_evidence),
    [application?.status_evidence]
  );
  const stickyNoteClass =
    "space-y-2 rounded-md border border-amber-300/50 bg-amber-50/80 p-3 dark:border-amber-700/30 dark:bg-amber-950/20";
  const savedEmailParts = useMemo(
    () => splitSavedEmail(form?.generated_email ?? ""),
    [form?.generated_email]
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const getPrimaryResumeText = async (): Promise<string> => {
    const res = await fetch("/api/resumes", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const payload = (await res.json()) as Resume[] | { error?: string };
    if (!res.ok) {
      throw new Error(parseApiError(payload, "Could not load resumes."));
    }

    const resumes = payload as Resume[];
    const primaryResume = resumes.find((resume) => resume.is_primary);
    const fallbackResume = resumes.find((resume) => resume.parsed_text?.trim());
    const parsedText = primaryResume?.parsed_text?.trim() || fallbackResume?.parsed_text?.trim();

    if (!parsedText) {
      throw new Error(
        "No parsed resume text available. Upload a PDF resume in Profile first."
      );
    }

    return parsedText;
  };

  const updateApplicationByPatch = useCallback(async (
    patch: Record<string, unknown>,
    fallbackError: string
  ): Promise<Application> => {
    if (!application) {
      throw new Error("Application is not available.");
    }

    const res = await fetch("/api/applications", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: application.id,
        ...patch,
      }),
    });
    const payload = (await res.json()) as Application | { error?: string; detail?: string };
    if (!res.ok) {
      throw new Error(parseApiError(payload, fallbackError));
    }

    const updated = payload as Application;
    onUpdated(updated);
    setForm(toFormState(updated));
    return updated;
  }, [application, onUpdated]);

  const moveToStatus = useCallback(async (status: ApplicationStatus) => {
    if (!application || !form) {
      return;
    }
    if (form.status === status) {
      return;
    }

    try {
      const updated = await updateApplicationByPatch(
        { status },
        `Could not move to ${STATUS_LABELS[status]}.`
      );
      setForm(toFormState(updated));
      toast.success(`Moved to ${STATUS_LABELS[status]}.`);
      if (status === "offer") {
        celebrateOffer();
        toast.success("🎉 Congratulations! You got an offer!", {
          description: `${updated.company} — ${updated.role}`,
          duration: 5000,
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not move application.");
    }
  }, [application, form, updateApplicationByPatch]);

  const undoAutoUpdate = useCallback(async () => {
    if (!application) return;
    try {
      const res = await fetch("/api/applications/undo-status", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ applicationId: application.id }),
      });
      const payload = (await res.json()) as Application | { error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Undo failed."));
      }
      const updated = payload as Application;
      onUpdated(updated);
      setForm(toFormState(updated));
      toast.success("Update reverted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Undo failed.");
    }
  }, [application, onUpdated]);

  const applySuggestion = useCallback(async () => {
    if (!application) return;
    try {
      const res = await fetch("/api/applications/apply-suggestion", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ applicationId: application.id }),
      });
      const payload = (await res.json()) as Application | { error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Could not apply suggestion."));
      }
      const updated = payload as Application;
      onUpdated(updated);
      setForm(toFormState(updated));
      toast.success("Suggestion applied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply suggestion.");
    }
  }, [application, onUpdated]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey) {
        return;
      }
      const activeTag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      const map = APPLICATION_STATUSES.reduce<Record<string, ApplicationStatus>>(
        (acc, status, idx) => {
          acc[`Digit${idx + 1}`] = status;
          return acc;
        },
        {}
      );
      const nextStatus = map[event.code];
      if (!nextStatus) {
        return;
      }
      event.preventDefault();
      void moveToStatus(nextStatus);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, moveToStatus]);

  const handleSave = async () => {
    if (!application || !form) return;
    if (!form.company.trim() || !form.role.trim()) {
      toast.error("Company and role are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: application.id,
          ...form,
          company: form.company.trim(),
          role: form.role.trim(),
        }),
      });
      const payload = (await res.json()) as Application | { error?: string };
      if (!res.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Could not update application."
        );
      }
      onUpdated(payload as Application);
      toast.success("Application updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update application.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;
    if (!window.confirm("Delete this application? This cannot be undone.")) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: application.id }),
      });
      const payload = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Could not delete application.");
      }
      onDeleted(application.id);
      onOpenChange(false);
      toast.success("Application deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete application.");
    } finally {
      setDeleting(false);
    }
  };

  const copySavedEmail = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const handleAnalyzeFit = async () => {
    if (!application || !form?.job_url?.trim()) {
      toast.error("Add a valid job URL first.");
      return;
    }

    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;
    if (!fastApiUrl) {
      toast.error("NEXT_PUBLIC_FASTAPI_URL is not configured.");
      return;
    }

    setAnalyzingFit(true);
    try {
      const resumeText = await getPrimaryResumeText();
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please log in again to continue.");
      }

      const analyzeRes = await fetch(`${fastApiUrl}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          job_url: form.job_url.trim(),
          resume_text: resumeText,
        }),
      });
      const analyzePayload = (await analyzeRes.json()) as
        | AnalyzeResult
        | { error?: string; detail?: string };
      if (!analyzeRes.ok) {
        throw new Error(parseApiError(analyzePayload, "Failed to analyze fit."));
      }

      const result = analyzePayload as AnalyzeResult;
      setFitResult(result);
      await updateApplicationByPatch(
        {
          fit_score: result.fit_score,
          fit_analysis: JSON.stringify(result.analysis),
        },
        "Could not save fit analysis."
      );
      toast.success("Fit analysis generated and saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze fit.");
    } finally {
      setAnalyzingFit(false);
    }
  };

  const handleGenerateColdEmail = async () => {
    if (!application || !form?.job_url?.trim()) {
      toast.error("Add a valid job URL first.");
      return;
    }

    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;
    if (!fastApiUrl) {
      toast.error("NEXT_PUBLIC_FASTAPI_URL is not configured.");
      return;
    }

    setGeneratingEmail(true);
    try {
      const resumeText = await getPrimaryResumeText();
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please log in again to continue.");
      }

      const generateRes = await fetch(`${fastApiUrl}/api/generate-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          job_url: form.job_url.trim(),
          company: form.company.trim(),
          role: form.role.trim(),
          contact_name: form.contact_name.trim() || undefined,
          tone: "professional",
          resume_text: resumeText,
        }),
      });
      const generatePayload = (await generateRes.json()) as
        | GeneratedEmailResult
        | { error?: string; detail?: string };
      if (!generateRes.ok) {
        throw new Error(parseApiError(generatePayload, "Failed to generate cold email."));
      }

      const generated = generatePayload as GeneratedEmailResult;
      const generatedEmailText = `Subject: ${generated.subject}\n\n${generated.body}`;
      await updateApplicationByPatch(
        {
          generated_email: generatedEmailText,
        },
        "Could not save generated cold email."
      );
      toast.success("Cold email generated and saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate cold email.");
    } finally {
      setGeneratingEmail(false);
    }
  };

  if (!application || !form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-full max-h-[90vh] overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{application.company}</DialogTitle>
            <Badge className={cn("border", STATUS_COLORS[application.status])}>
              {STATUS_LABELS[application.status]}
            </Badge>
            {fitScoreLabel ? <Badge variant="secondary">Fit {fitScoreLabel}</Badge> : null}
            {sourceBadge ? (
              <Badge variant="outline" className={cn("text-[10px]", sourceBadge.className)}>
                {sourceBadge.label}
              </Badge>
            ) : null}
          </div>
          <DialogDescription>
            Update details, track outcomes, and prepare for follow-ups.
          </DialogDescription>
          {application.status_source === "email_auto" && application.auto_updated_at ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-cyan-700 dark:text-cyan-300">
                Email updated this {friendlyTimeAgo(application.auto_updated_at)}.
              </span>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => void undoAutoUpdate()}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Undo
              </Button>
            </div>
          ) : null}
          {(application.suggestion_pending || application.status_source === "email_suggested") &&
          suggestedTarget ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-amber-700 dark:text-amber-300">
                Suggested move: {suggestedTarget.label} ({Math.round((application.status_confidence ?? 0) * 100)}
                %)
              </span>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => void applySuggestion()}>
                Apply suggestion
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => void undoAutoUpdate()}>
                Dismiss
              </Button>
            </div>
          ) : null}
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="detail-company">Company</Label>
              <Input
                id="detail-company"
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-role">Role</Label>
              <Input
                id="detail-role"
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail-job-url">Job URL</Label>
            <Input
              id="detail-job-url"
              value={form.job_url}
              onChange={(e) => setField("job_url", e.target.value)}
              placeholder="https://jobs.example.com/..."
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setField("status", v as Application["status"])}
              >
                <SelectTrigger>
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
              <p className="text-[11px] text-muted-foreground">
                Quick keys: Shift+1..Shift+{APPLICATION_STATUSES.length}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-location">Location</Label>
              <Input
                id="detail-location"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-salary">Salary Range</Label>
              <Input
                id="detail-salary"
                value={form.salary_range}
                onChange={(e) => setField("salary_range", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Move Quickly</Label>
            <div className="flex flex-wrap gap-2">
              {APPLICATION_STATUSES.map((status, idx) => (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "transition-all duration-150",
                    form.status === status && "border-primary/30 bg-primary/10 text-primary"
                  )}
                  onClick={() => void moveToStatus(status)}
                >
                  {STATUS_LABELS[status]} (Shift+{idx + 1})
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="detail-contact-name">Contact Name</Label>
              <Input
                id="detail-contact-name"
                value={form.contact_name}
                onChange={(e) => setField("contact_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-contact-email">Contact Email</Label>
              <Input
                id="detail-contact-email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setField("contact_email", e.target.value)}
              />
            </div>
          </div>

          <div className={stickyNoteClass}>
            <Label htmlFor="detail-notes" className="text-amber-800 dark:text-amber-200">
              Notes (Post-it)
            </Label>
            <Textarea
              id="detail-notes"
              rows={4}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className="border-amber-300 bg-amber-100/60 text-amber-950 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-100"
            />
          </div>

          {application.fit_score !== null || form.fit_analysis ? (
            <div className={stickyNoteClass}>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Saved Fit Analysis (Post-it)</p>
              {application.fit_score !== null ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">Score: {application.fit_score}/100</p>
              ) : null}
              <Textarea
                rows={4}
                value={form.fit_analysis}
                onChange={(e) => setField("fit_analysis", e.target.value)}
                placeholder="AI fit analysis summary"
                className="border-amber-300 bg-amber-100/60 text-amber-950 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-100"
              />
            </div>
          ) : null}

          {fitResult ? (
            <FitScoreDisplay result={fitResult} jobUrl={form.job_url} showSaveAction={false} />
          ) : null}

          {form.generated_email ? (
            <details className="rounded-md border p-3" open>
              <summary className="cursor-pointer text-sm font-medium">Saved Cold Email</summary>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copySavedEmail(savedEmailParts.subject, "Subject")}
                    disabled={!savedEmailParts.subject}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy Subject
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copySavedEmail(savedEmailParts.body, "Body")}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy Body
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copySavedEmail(form.generated_email, "Email")}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy All
                  </Button>
                </div>
                <Textarea
                  rows={6}
                  value={form.generated_email}
                  onChange={(e) => setField("generated_email", e.target.value)}
                />
              </div>
            </details>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleAnalyzeFit()}
              disabled={!form.job_url.trim() || analyzingFit || generatingEmail}
            >
              {analyzingFit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Fit
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleGenerateColdEmail()}
              disabled={!form.job_url.trim() || generatingEmail || analyzingFit}
            >
              {generatingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Cold Email
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting || saving}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving || deleting}
            >
              Close
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving || deleting}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
