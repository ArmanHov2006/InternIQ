"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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
  const [prepareOpen, setPrepareOpen] = useState(true);

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
    <div className="space-y-6">
      <section className="space-y-3 rounded-md border border-border p-3">
        <h3 className="text-sm font-medium">Analyze fit</h3>
        <p className="text-xs text-muted-foreground">
          Uses your primary resume from Settings. Requires a job URL on the application.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => void handleAnalyzeFit()}
          disabled={analyzingFit || !form.job_url?.trim()}
        >
          {analyzingFit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {hasFit ? "Re-run analysis" : "Run fit analysis"}
        </Button>
        {fitResult ? (
          <div className="pt-2">
            <FitScoreDisplay result={fitResult} jobUrl={form.job_url} showSaveAction={false} />
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <button
          type="button"
          onClick={() => setPrepareOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm font-medium"
        >
          Prepare (email, letters, prep)
          <ChevronDown className={cn("h-4 w-4 transition", prepareOpen && "rotate-180")} />
        </button>
        {prepareOpen ? (
          <div className="space-y-6 border-l border-border pl-3">
            <div className="space-y-2">
              <Label className="text-xs">Resume for AI</Label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId} disabled={loadingResumes}>
                <SelectTrigger className="h-9">
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

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Cold email</h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleGenerateColdEmail()}
                disabled={generatingEmail || !form.job_url?.trim()}
              >
                {generatingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Generate & save
              </Button>
              {form.generated_email ? (
                <Textarea readOnly rows={5} value={form.generated_email} className="text-xs" />
              ) : null}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Cover letter</h4>
              <div className="flex gap-2">
                <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                  <SelectTrigger className="h-9 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" variant="outline" onClick={() => void handleCoverLetter()} disabled={coverLoading}>
                  {coverLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
                </Button>
              </div>
              {meta.coverLetter?.content ? (
                <div className="rounded border border-border bg-muted/20 p-2 text-xs">
                  <p className="font-medium">{meta.coverLetter.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{meta.coverLetter.content}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Interview prep</h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleInterviewPrep()}
                disabled={interviewLoading || !form.job_url?.trim()}
              >
                {interviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate questions"}
              </Button>
              {meta.interviewPrep?.questions?.length ? (
                <ul className="space-y-2 text-xs">
                  {meta.interviewPrep.questions.slice(0, 5).map((q, i) => (
                    <li key={i} className="rounded border border-border p-2">
                      <p className="font-medium">{q.question}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Resume tailor</h4>
              <Textarea
                rows={4}
                placeholder="Paste job description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="text-xs"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => void handleResumeTailor()} disabled={tailorLoading}>
                {tailorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get suggestions"}
              </Button>
              {meta.resumeTailor?.summary ? (
                <p className="text-xs text-muted-foreground">{meta.resumeTailor.summary}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

type CoverLetterResult = { title: string; content: string };

type TailorApiResult = {
  summary: string;
  suggestions: unknown[];
};
