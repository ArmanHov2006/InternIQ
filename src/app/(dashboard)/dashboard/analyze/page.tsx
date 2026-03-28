"use client";

import { useMemo, useState } from "react";
import { FileSearch, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LocalResumeAnalysisResult } from "@/components/ai/local-resume-analysis-result";
import { EmptyState } from "@/components/ui/empty-state";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/glass-card";
import { extractTextFromPdfFile } from "@/lib/pdf/extract-text-client";
import { analyzeResumeFit } from "@/lib/services/resume-analyzer";
import { useAnalyzeStore } from "@/stores/analyze-store";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export default function AnalyzePage() {
  const [jobInput, setJobInput] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const {
    resumes,
    analyses,
    activeAnalysisId,
    addResume,
    setPrimaryResume,
    saveAnalysis,
    setActiveAnalysis,
    removeAnalysis,
    clearHistory,
  } = useAnalyzeStore();

  const activeAnalysis = useMemo(
    () => analyses.find((item) => item.id === activeAnalysisId) ?? null,
    [analyses, activeAnalysisId]
  );
  const primaryResumeId = useMemo(
    () => resumes.find((resume) => resume.isPrimary)?.id ?? resumes[0]?.id ?? "",
    [resumes]
  );
  const resolvedResumeId = selectedResumeId || primaryResumeId;
  const selectedResumeText = useMemo(
    () => resumes.find((resume) => resume.id === resolvedResumeId)?.text.trim() ?? "",
    [resumes, resolvedResumeId]
  );

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
      const extractedText = await extractTextFromPdfFile(file);
      if (!extractedText.trim()) {
        throw new Error("No readable text found in this PDF. Try another file.");
      }
      const id = addResume({ fileName: file.name, text: extractedText });
      setSelectedResumeId(id);
      toast.success("Resume uploaded and selected.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload resume.";
      toast.error(message);
    } finally {
      setUploadingResume(false);
    }
  };

  const runAnalyze = async () => {
    if (!jobInput.trim()) {
      toast.error("Paste a job URL or job description first.");
      return;
    }
    if (!selectedResumeText.trim()) {
      toast.error("Select or upload a resume first.");
      return;
    }

    setAnalyzing(true);
    try {
      const selectedResume = resumes.find((resume) => resume.id === resolvedResumeId);
      const computation = analyzeResumeFit(selectedResumeText, jobInput.trim());
      saveAnalysis({
        resumeFileName: selectedResume?.fileName ?? "Uploaded Resume",
        resumeText: selectedResumeText,
        jobInput: jobInput.trim(),
        fitScore: computation.fitScore,
        missingKeywords: computation.missingKeywords,
        suggestions: computation.suggestions,
        highlights: computation.highlights,
        matchedKeywords: computation.matchedKeywords,
        actionVerbCoverage: computation.actionVerbCoverage,
      });
      toast.success("Fit analysis completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to analyze fit.";
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl md:text-5xl">Resume Analyzer</h1>

      <GlassCard className="p-5" tiltEnabled={false}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="analyze-job-input">Job URL or Description</Label>
            <Textarea
              id="analyze-job-input"
              rows={5}
              value={jobInput}
              onChange={(event) => setJobInput(event.target.value)}
              placeholder="Paste the job posting URL or full job description..."
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label>Resume source</Label>
              <Select
                value={resolvedResumeId}
                onValueChange={(value) => {
                  setSelectedResumeId(value);
                  setPrimaryResume(value);
                }}
                disabled={resumes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={resumes.length ? "Select resume" : "No resumes uploaded"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.fileName}
                      {resume.isPrimary ? " (Primary)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="self-end" />
          </div>

          <label
            className={`glass flex cursor-pointer items-center justify-between rounded-xl p-4 transition ${
              dragging ? "border-cyan-400/60 bg-cyan-500/10" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void handleUploadResume(file);
            }}
          >
            <div>
              <p className="text-sm font-medium">Upload a resume PDF</p>
              <p className="text-xs text-muted-foreground">
                Parsed client-side and saved only in local storage.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-primary">
              <Upload className="h-4 w-4" />
              {uploadingResume ? "Uploading..." : "Choose PDF"}
            </div>
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

          <MagneticButton onClick={() => void runAnalyze()} disabled={analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Fit...
              </>
            ) : (
              "Analyze Fit"
            )}
          </MagneticButton>
        </div>
      </GlassCard>

      {analyses.length > 0 ? (
        <GlassCard className="p-4" tiltEnabled={false}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Past Analyses</p>
            <MagneticButton variant="outline" size="sm" onClick={clearHistory}>
              Clear History
            </MagneticButton>
          </div>
          <div className="space-y-2">
            {analyses.map((entry) => (
              <motion.div
                key={entry.id}
                className={`glass flex items-center justify-between rounded-lg p-3 ${
                  entry.id === activeAnalysisId ? "border-cyan-400/50" : ""
                }`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setActiveAnalysis(entry.id)}
                >
                  <p className="truncate text-sm font-medium">
                    {entry.resumeFileName} · {entry.fitScore}/100
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </button>
                <MagneticButton variant="ghost" size="icon" onClick={() => removeAnalysis(entry.id)}>
                  <Trash2 className="h-4 w-4" />
                </MagneticButton>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      ) : null}

      {!activeAnalysis ? (
        <EmptyState
          icon={<FileSearch className="h-5 w-5" />}
          title="No analysis yet"
          description="Run an analysis to see fit score, missing keywords, and actionable suggestions."
        />
      ) : (
        <LocalResumeAnalysisResult analysis={activeAnalysis} />
      )}
    </div>
  );
}
