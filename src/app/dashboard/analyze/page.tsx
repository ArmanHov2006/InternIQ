"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Resume } from "@/types/database";
import { FitScoreDisplay, type AnalyzeResult } from "@/components/ai/fit-score-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition } from "@/components/ui/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { parseApiError } from "@/lib/utils";

export default function AnalyzePage() {
  const [jobUrl, setJobUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [pdfUploading, setPdfUploading] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  useEffect(() => {
    const loadPrimaryResume = async () => {
      setLoadingPrefill(true);
      try {
        const res = await fetch("/api/resumes", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const payload = (await res.json()) as Resume[] | { error?: string };
        if (!res.ok) {
          throw new Error(parseApiError(payload, "Could not load resumes."));
        }

        const resumes = payload as Resume[];
        const primary = resumes.find((resume) => resume.is_primary);
        if (primary?.parsed_text?.trim()) {
          setResumeText(primary.parsed_text);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load resumes.");
      } finally {
        setLoadingPrefill(false);
      }
    };

    void loadPrimaryResume();
  }, []);

  const handleAnalyze = async () => {
    if (!jobUrl.trim() || !resumeText.trim()) return;

    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;
    if (!fastApiUrl) {
      toast.error("NEXT_PUBLIC_FASTAPI_URL is not configured.");
      return;
    }

    setAnalyzing(true);
    setResult(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Please log in again to continue.");
        return;
      }

      const res = await fetch(`${fastApiUrl}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          job_url: jobUrl.trim(),
          resume_text: resumeText.trim(),
        }),
      });
      const payload = (await res.json()) as AnalyzeResult | { detail?: string; error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Failed to analyze fit."));
      }

      setResult(payload as AnalyzeResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze fit.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePdfUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume must be 5MB or smaller.");
      return;
    }

    setPdfUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/resumes/parse", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const payload = (await res.json()) as { parsed_text?: string; error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Failed to parse PDF resume."));
      }
      const extracted = payload.parsed_text?.trim() ?? "";
      if (!extracted) {
        throw new Error(
          "No extractable text was found in this PDF. Try a text-based PDF or paste your resume text manually."
        );
      }
      setResumeText(extracted);
      toast.success("Resume text extracted from PDF.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to parse PDF resume.");
    } finally {
      setPdfUploading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resume Analyzer</h1>
          <p className="text-sm text-muted-foreground">
            Paste a job URL and compare it with your resume for an AI fit score.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>Provide the job posting and your resume text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-url">Job URL</Label>
              <Input
                id="job-url"
                placeholder="https://jobs.lever.co/..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-text">Your Resume</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Label
                  htmlFor="resume-pdf-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  {pdfUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileUp className="h-3.5 w-3.5" />
                  )}
                  Upload PDF Resume
                </Label>
                <input
                  id="resume-pdf-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => void handlePdfUpload(e)}
                  disabled={pdfUploading || analyzing}
                />
                <p className="text-xs text-muted-foreground">PDF only, max 5MB</p>
              </div>
              <Textarea
                id="resume-text"
                rows={12}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder={
                  loadingPrefill
                    ? "Loading your primary resume..."
                    : "Paste your resume text here..."
                }
              />
            </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => void handleAnalyze()}
                disabled={!jobUrl.trim() || !resumeText.trim() || analyzing || loadingPrefill}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing your fit...
                  </>
                ) : (
                  "Analyze Fit"
                )}
              </Button>
              {analyzing ? (
                <p className="text-xs text-muted-foreground">
                  This may take 10-20 seconds on the first request.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <div>
            {analyzing ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <Skeleton className="h-32 w-32 rounded-full" />
                  </div>
                  <Skeleton className="h-20 w-full rounded-md" />
                  <Skeleton className="h-16 w-full rounded-md" />
                </CardContent>
              </Card>
            ) : result ? (
              <FitScoreDisplay result={result} jobUrl={jobUrl.trim()} />
            ) : (
              <Card className="h-full">
                <CardContent className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground">
                  Results will appear here after analysis.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
