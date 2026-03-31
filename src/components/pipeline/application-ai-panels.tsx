"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { FileText, Loader2, Mail, MessagesSquare, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Application, Resume } from "@/types/database";
import { cn } from "@/lib/utils";
import { FitScoreDisplay, type AnalyzeResult } from "@/components/ai/fit-score-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type AiMeta = {
  coverLetter?: { title: string; content: string; tone?: string };
  interviewPrep?: {
    questions: Array<{ category: string; question: string; answer_framework: string }>;
  };
  resumeTailor?: { summary: string; suggestions: unknown[] };
};

const parseApiError = (payload: unknown, fallback: string): string => {
  if (typeof payload === "object" && payload !== null && "error" in payload && typeof (payload as { error: unknown }).error === "string") {
    return (payload as { error: string }).error;
  }
  if (typeof payload === "object" && payload !== null && "detail" in payload && typeof (payload as { detail: unknown }).detail === "string") {
    return (payload as { detail: string }).detail;
  }
  return fallback;
};

const getAiMeta = (app: Application): AiMeta => {
  const raw = app.ai_metadata;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as AiMeta;
  return {};
};

const mergeMeta = (app: Application, patch: Partial<AiMeta>): Record<string, unknown> => ({
  ...getAiMeta(app),
  ...patch,
});

function AiActionRow({
  icon,
  title,
  description,
  action,
  loading,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-colors duration-100",
        loading && "animate-glow-pulse shadow-glow-xs"
      )}
    >
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex shrink-0 justify-end sm:justify-start">{action}</div>
      </div>
      {children ? <div className="mt-4 space-y-3 border-t border-border pt-4">{children}</div> : null}
    </div>
  );
}

export function ApplicationAiPanels({
  application,
  form,
  fitResult,
  setFitResult,
  onPatch,
}: {
  application: Application;
  form: FormState;
  fitResult: AnalyzeResult | null;
  setFitResult: (r: AnalyzeResult | null) => void;
  onPatch: (patch: Record<string, unknown>, err: string) => Promise<Application>;
}) {
  const [analyzingFit, setAnalyzingFit] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [tone, setTone] = useState<"professional" | "casual" | "enthusiastic">("professional");
  const [coverLoading, setCoverLoading] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");

  const meta = getAiMeta(application);
  const selectedResumeText = resumes.find((r) => r.id === selectedResumeId)?.parsed_text?.trim() ?? "";

  const loadResumes = useCallback(async () => {
    setLoadingResumes(true);
    try {
      const res = await fetch("/api/resumes", { credentials: "same-origin", headers: { Accept: "application/json" } });
      const payload = (await res.json()) as Resume[] | { error?: string };
      if (!res.ok) throw new Error(("error" in payload && payload.error) || "Failed to load resumes.");
      const list = payload as Resume[];
      setResumes(list);
      const primary = list.find((r) => r.is_primary) ?? list[0];
      setSelectedResumeId(primary?.id ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load resumes.");
    } finally {
      setLoadingResumes(false);
    }
  }, []);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  const getPrimaryResumeText = async (): Promise<string> => {
    const res = await fetch("/api/resumes", { credentials: "same-origin", headers: { Accept: "application/json" } });
    const payload = (await res.json()) as Resume[] | { error?: string };
    if (!res.ok) throw new Error(parseApiError(payload, "Could not load resumes."));
    const list = payload as Resume[];
    const primary = list.find((r) => r.is_primary);
    const fallback = list.find((r) => r.parsed_text?.trim());
    const text = primary?.parsed_text?.trim() || fallback?.parsed_text?.trim();
    if (!text) throw new Error("Upload a resume in Settings.");
    return text;
  };

  const handleAnalyzeFit = async () => {
    if (!form.job_url?.trim()) {
      toast.error("Add a job URL on the Overview tab.");
      return;
    }
    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;
    if (!fastApiUrl) {
      toast.error("AI backend URL is not configured.");
      return;
    }
    setAnalyzingFit(true);
    try {
      const resumeText = await getPrimaryResumeText();
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please log in again.");
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
      const analyzePayload = (await analyzeRes.json()) as AnalyzeResult | { error?: string; detail?: string };
      if (!analyzeRes.ok) throw new Error(parseApiError(analyzePayload, "Failed to analyze fit."));
      const result = analyzePayload as AnalyzeResult;
      setFitResult(result);
      await onPatch(
        {
          fit_score: result.fit_score,
          fit_analysis: JSON.stringify(result.analysis),
        },
        "Could not save fit analysis."
      );
      toast.success("Fit analysis saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze fit.");
    } finally {
      setAnalyzingFit(false);
    }
  };

  const handleGenerateColdEmail = async () => {
    if (!form.job_url?.trim()) {
      toast.error("Add a job URL on the Overview tab.");
      return;
    }
    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;
    if (!fastApiUrl) {
      toast.error("AI backend URL is not configured.");
      return;
    }
    setGeneratingEmail(true);
    try {
      const resumeText = await getPrimaryResumeText();
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please log in again.");
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
        | { subject: string; body: string }
        | { error?: string; detail?: string };
      if (!generateRes.ok) throw new Error(parseApiError(generatePayload, "Failed to generate email."));
      const generated = generatePayload as { subject: string; body: string };
      const text = `Subject: ${generated.subject}\n\n${generated.body}`;
      await onPatch({ generated_email: text }, "Could not save email.");
      toast.success("Cold email saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate email.");
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleCoverLetter = async () => {
    if (!form.job_url?.trim() || !selectedResumeText) {
      toast.error("Job URL and resume are required.");
      return;
    }
    setCoverLoading(true);
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          job_url: form.job_url.trim(),
          resume_text: selectedResumeText,
          company: form.company.trim(),
          role: form.role.trim(),
          tone,
        }),
      });
      const payload = (await res.json()) as CoverLetterResult | { error?: string };
      if (!res.ok) throw new Error(("error" in payload && payload.error) || "Failed to generate.");
      const result = payload as CoverLetterResult;
      const nextMeta = mergeMeta(application, {
        coverLetter: { title: result.title, content: result.content, tone },
      });
      await onPatch({ ai_metadata: nextMeta }, "Could not save cover letter.");
      toast.success("Cover letter saved to this application.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setCoverLoading(false);
    }
  };

  const handleInterviewPrep = async () => {
    if (!form.job_url?.trim() || !selectedResumeText) {
      toast.error("Job URL and resume are required.");
      return;
    }
    setInterviewLoading(true);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          job_url: form.job_url.trim(),
          resume_text: selectedResumeText,
        }),
      });
      const payload = (await res.json()) as { questions?: unknown; error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed.");
      const questions = payload.questions;
      if (!Array.isArray(questions)) throw new Error("Invalid response.");
      const nextMeta = mergeMeta(application, { interviewPrep: { questions } });
      await onPatch({ ai_metadata: nextMeta }, "Could not save interview prep.");
      toast.success("Interview prep saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleResumeTailor = async () => {
    if (!selectedResumeText || !jobDescription.trim()) {
      toast.error("Select resume and paste job description.");
      return;
    }
    setTailorLoading(true);
    try {
      const res = await fetch("/api/resume-tailor", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          resume_text: selectedResumeText,
          job_description: jobDescription.trim(),
        }),
      });
      const payload = (await res.json()) as TailorApiResult | { error?: string };
      if (!res.ok) throw new Error(("error" in payload && payload.error) || "Failed.");
      const data = payload as TailorApiResult;
      const nextMeta = mergeMeta(application, {
        resumeTailor: { summary: data.summary, suggestions: data.suggestions },
      });
      await onPatch({ ai_metadata: nextMeta }, "Could not save tailor results.");
      toast.success("Resume tailor saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setTailorLoading(false);
    }
  };

  const hasFit = application.fit_score !== null && application.fit_score !== undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Resume for AI</Label>
        <Select value={selectedResumeId} onValueChange={setSelectedResumeId} disabled={loadingResumes}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={loadingResumes ? "Loading…" : "Select resume"} />
          </SelectTrigger>
          <SelectContent>
            {resumes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.file_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AiActionRow
        icon={<Sparkles className="h-4 w-4" />}
        title="Fit analysis"
        description="Uses your primary resume from Settings. Requires a job URL on the Overview tab."
        loading={analyzingFit}
        action={
          <Button
            type="button"
            size="sm"
            className="min-w-[88px] px-4"
            onClick={() => void handleAnalyzeFit()}
            disabled={analyzingFit || !form.job_url?.trim()}
          >
            {analyzingFit ? <Loader2 className="h-4 w-4 animate-spin" /> : hasFit ? "Re-run" : "Run"}
          </Button>
        }
      >
        {fitResult ? <FitScoreDisplay result={fitResult} jobUrl={form.job_url} showSaveAction={false} /> : null}
      </AiActionRow>

      <AiActionRow
        icon={<Wand2 className="h-4 w-4" />}
        title="Resume tailor"
        description="Paste a job description and align your selected resume."
        loading={tailorLoading}
        action={
          <Button
            type="button"
            size="sm"
            className="min-w-[88px] px-4"
            onClick={() => void handleResumeTailor()}
            disabled={tailorLoading || !selectedResumeText || !jobDescription.trim()}
          >
            {tailorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
          </Button>
        }
      >
        <Textarea
          rows={4}
          placeholder="Paste job description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="text-xs"
        />
        {meta.resumeTailor?.summary ? (
          <p className="text-xs text-muted-foreground">{meta.resumeTailor.summary}</p>
        ) : null}
      </AiActionRow>

      <AiActionRow
        icon={<FileText className="h-4 w-4" />}
        title="Cover letter"
        description="Match tone to the company and role."
        loading={coverLoading}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <SelectTrigger className="h-9 w-[132px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" size="sm" className="min-w-[88px] px-4" onClick={() => void handleCoverLetter()} disabled={coverLoading}>
              {coverLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
            </Button>
          </div>
        }
      >
        {meta.coverLetter?.content ? (
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
            <p className="font-medium text-foreground">{meta.coverLetter.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{meta.coverLetter.content}</p>
          </div>
        ) : null}
      </AiActionRow>

      <AiActionRow
        icon={<MessagesSquare className="h-4 w-4" />}
        title="Interview prep"
        description="Generates focused questions from the job URL and resume."
        loading={interviewLoading}
        action={
          <Button
            type="button"
            size="sm"
            className="min-w-[88px] px-4"
            onClick={() => void handleInterviewPrep()}
            disabled={interviewLoading || !form.job_url?.trim()}
          >
            {interviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
          </Button>
        }
      >
        {meta.interviewPrep?.questions?.length ? (
          <ul className="space-y-2 text-xs">
            {meta.interviewPrep.questions.slice(0, 5).map((q, i) => (
              <li key={i} className="rounded-lg border border-border p-2">
                <p className="font-medium text-foreground">{q.question}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </AiActionRow>

      <AiActionRow
        icon={<Mail className="h-4 w-4" />}
        title="Cold email"
        description="Outreach draft saved to this application."
        loading={generatingEmail}
        action={
          <Button
            type="button"
            size="sm"
            className="min-w-[88px] px-4"
            onClick={() => void handleGenerateColdEmail()}
            disabled={generatingEmail || !form.job_url?.trim()}
          >
            {generatingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
          </Button>
        }
      >
        {form.generated_email ? (
          <Textarea readOnly rows={5} value={form.generated_email} className="text-xs" />
        ) : null}
      </AiActionRow>
    </div>
  );
}

type CoverLetterResult = { title: string; content: string };

type TailorApiResult = {
  summary: string;
  suggestions: unknown[];
};
