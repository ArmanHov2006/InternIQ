"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ColdEmailGenerator, type GeneratedEmail } from "@/components/ai/cold-email-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createClient } from "@/lib/supabase/client";
import type { Resume } from "@/types/database";
import { PageTransition } from "@/components/ui/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { parseApiError } from "@/lib/utils";

export default function EmailPage() {
  const [jobUrl, setJobUrl] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [contactName, setContactName] = useState("");
  const [tone, setTone] = useState("professional");
  const [resumeText, setResumeText] = useState("");
  const [pdfUploading, setPdfUploading] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedEmail | null>(null);

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

  const handleGenerate = async () => {
    if (!jobUrl.trim() || !company.trim() || !role.trim() || !resumeText.trim()) return;

    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;
    if (!fastApiUrl) {
      toast.error("NEXT_PUBLIC_FASTAPI_URL is not configured.");
      return;
    }

    setGenerating(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please log in again to continue.");
        return;
      }

      const res = await fetch(`${fastApiUrl}/api/generate-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          job_url: jobUrl.trim(),
          company: company.trim(),
          role: role.trim(),
          contact_name: contactName.trim() || undefined,
          tone,
          resume_text: resumeText.trim(),
        }),
      });
      const payload = (await res.json()) as GeneratedEmail | { error?: string; detail?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Failed to generate cold email."));
      }
      setResult(payload as GeneratedEmail);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate cold email.");
    } finally {
      setGenerating(false);
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
          <h1 className="text-2xl font-semibold tracking-tight">Cold Email Generator</h1>
          <p className="text-sm text-muted-foreground">
            Generate personalized outreach emails from a job post and your resume.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>
                Provide job details and your resume text, then generate a tailored email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-job-url">Job URL</Label>
              <Input
                id="email-job-url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://jobs.example.com/..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email-company">Company</Label>
                <Input
                  id="email-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-role">Role</Label>
                <Input
                  id="email-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email-contact-name">Contact Name (optional)</Label>
                <Input
                  id="email-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Hiring Manager"
                />
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="confident">Confident</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-resume-text">Resume Text</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Label
                  htmlFor="email-resume-pdf-upload"
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
                  id="email-resume-pdf-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => void handlePdfUpload(e)}
                  disabled={pdfUploading || generating}
                />
                <p className="text-xs text-muted-foreground">PDF only, max 5MB</p>
              </div>
              <Textarea
                id="email-resume-text"
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
                onClick={() => void handleGenerate()}
                disabled={
                  generating ||
                  pdfUploading ||
                  loadingPrefill ||
                  !jobUrl.trim() ||
                  !company.trim() ||
                  !role.trim() ||
                  !resumeText.trim()
                }
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crafting your email...
                  </>
                ) : (
                  "Generate Cold Email"
                )}
              </Button>
            </CardContent>
          </Card>

          <div>
            {generating ? (
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
              <ColdEmailGenerator
                result={result}
                jobUrl={jobUrl.trim()}
                defaultCompany={company.trim()}
                defaultRole={role.trim()}
                defaultContactName={contactName.trim()}
                onRegenerate={() => void handleGenerate()}
                regenerating={generating}
              />
            ) : (
              <Card className="h-full">
                <CardContent className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground">
                  Your generated subject and email body will appear here.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
