"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Resume } from "@/types/database";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagneticButton } from "@/components/ui/magnetic-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportSettingsDialog } from "@/components/ai/export/export-settings-dialog";
import { buildInterviewPrepDocument } from "@/lib/pdf/renderers/feature-renderers";

type InterviewQuestion = {
  category: string;
  question: string;
  answer_framework: string;
};

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export default function InterviewPrepPage() {
  const [jobUrl, setJobUrl] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [practiceMode, setPracticeMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [exportOpen, setExportOpen] = useState(false);

  const selectedResumeText = useMemo(() => {
    return resumes.find((resume) => resume.id === selectedResumeId)?.parsed_text?.trim() ?? "";
  }, [resumes, selectedResumeId]);

  const loadResumes = async () => {
    setLoadingResumes(true);
    try {
      const res = await fetch("/api/resumes", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const payload = (await res.json()) as Resume[] | { error?: string };
      if (!res.ok) throw new Error(("error" in payload && payload.error) || "Failed to load resumes.");
      const list = payload as Resume[];
      setResumes(list);
      const primary = list.find((resume) => resume.is_primary) ?? list[0];
      setSelectedResumeId(primary?.id || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load resumes.");
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    void loadResumes();
  }, []);

  useEffect(() => {
    if (!practiceMode) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [practiceMode]);

  const handleUploadResume = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toast.error("Resume must be 5MB or smaller.");
      return;
    }
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("is_primary", String(resumes.length === 0));
      const res = await fetch("/api/resumes", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const payload = (await res.json()) as Resume | { error?: string };
      if (!res.ok) {
        throw new Error(("error" in payload && payload.error) || "Could not upload resume.");
      }
      const created = payload as Resume;
      setResumes((prev) => [created, ...prev]);
      setSelectedResumeId(created.id);
      toast.success("Resume uploaded and selected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  const runGenerate = async () => {
    if (!jobUrl.trim() || !selectedResumeText) {
      toast.error("Add a job URL and select a resume.");
      return;
    }
    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          job_url: jobUrl.trim(),
          resume_text: selectedResumeText,
        }),
      });
      const payload = (await res.json()) as { questions?: InterviewQuestion[]; error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed to generate interview prep.");
      setQuestions(payload.questions ?? []);
      toast.success("Interview prep generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl md:text-5xl">AI Interview Prep</h1>

      <GlassCard className="p-5" tiltEnabled={false}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interview-job-url">Job URL</Label>
            <Input
              id="interview-job-url"
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              placeholder="https://jobs.example.com/..."
            />
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label>Resume</Label>
              <Select
                value={selectedResumeId}
                onValueChange={setSelectedResumeId}
                disabled={loadingResumes || resumes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingResumes
                        ? "Loading resumes..."
                        : resumes.length
                        ? "Select resume"
                        : "No resumes found"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.file_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="self-end">
              <div className="flex gap-2">
                <label className="inline-flex cursor-pointer items-center rounded-md border border-white/15 bg-white/[0.02] px-3 py-2 text-sm text-primary hover:bg-white/[0.05]">
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingResume ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleUploadResume(file);
                    }}
                  />
                </label>
                <MagneticButton
                  variant="outline"
                  onClick={() => void loadResumes()}
                  disabled={loadingResumes}
                >
                  {loadingResumes ? "Loading..." : "Refresh"}
                </MagneticButton>
              </div>
            </div>
          </div>
          <MagneticButton onClick={() => void runGenerate()} disabled={loadingQuestions}>
            {loadingQuestions ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Questions...
              </>
            ) : (
              "Generate Interview Prep"
            )}
          </MagneticButton>
        </div>
      </GlassCard>

      {!questions.length ? (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title="No questions yet"
          description="Generate role-specific practice questions and answer frameworks."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MagneticButton
              variant={practiceMode ? "secondary" : "outline"}
              onClick={() => {
                setPracticeMode((prev) => !prev);
                setTimeLeft(120);
              }}
            >
              {practiceMode ? "Exit Practice Mode" : "Start Practice Mode"}
            </MagneticButton>
            {practiceMode ? (
              <p className="text-sm text-muted-foreground">
                <Clock className="mr-1 inline h-4 w-4" />
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </p>
            ) : null}
            <MagneticButton variant="outline" className="gap-2" onClick={() => setExportOpen(true)}>
              <Download className="h-4 w-4" />
              Export PDF
            </MagneticButton>
          </div>
          {questions.map((item, index) => (
            <GlassCard key={`${item.question}-${index}`} className="p-4" tiltEnabled={false}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.category}</p>
              <p className="mt-2 font-medium">{item.question}</p>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-primary">Suggested answer framework</summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.answer_framework}</p>
              </details>
            </GlassCard>
          ))}
        </div>
      )}
      <ExportSettingsDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        defaultFilename={`interview-prep-${new Date().toISOString().slice(0, 10)}`}
        payloadFactory={({ filename, includeMetadata }) => ({
          feature: "interview-prep",
          template: "premium-default",
          filename,
          includeMetadata,
          document: buildInterviewPrepDocument({
            jobUrl: jobUrl.trim(),
            questions,
          }),
        })}
      />
    </div>
  );
}
