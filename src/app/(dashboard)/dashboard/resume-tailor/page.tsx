"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, SplitSquareHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Resume } from "@/types/database";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Textarea } from "@/components/ui/textarea";
import { ExportSettingsDialog } from "@/components/ai/export/export-settings-dialog";
import { applyTailorSuggestions, type TailorSuggestionPatch } from "@/lib/pdf/apply-edits";
import { buildResumeTailorDocument } from "@/lib/pdf/renderers/feature-renderers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TailorSuggestion = {
  section: string;
  original: string;
  suggested: string;
  rationale: string;
};

type TailorResult = {
  summary: string;
  suggestions: TailorSuggestion[];
};

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export default function ResumeTailorPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);

  const selectedResumeText = useMemo(
    () => resumes.find((resume) => resume.id === selectedResumeId)?.parsed_text?.trim() ?? "",
    [resumes, selectedResumeId]
  );

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

  const runTailor = async () => {
    if (!selectedResumeText || !jobDescription.trim()) {
      toast.error("Select resume and paste job description.");
      return;
    }
    setTailoring(true);
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
      const payload = (await res.json()) as TailorResult | { error?: string };
      if (!res.ok) throw new Error(("error" in payload && payload.error) || "Failed to tailor resume.");
      const parsed = payload as TailorResult;
      setResult(parsed);
      setSelectedSuggestionIds(new Set(parsed.suggestions.map((_, index) => `s-${index}`)));
      toast.success("Tailored suggestions generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to tailor resume.");
    } finally {
      setTailoring(false);
    }
  };

  const patches = useMemo<TailorSuggestionPatch[]>(() => {
    if (!result) return [];
    return result.suggestions.map((suggestion, index) => ({
      id: `s-${index}`,
      section: suggestion.section,
      original: suggestion.original,
      suggested: suggestion.suggested,
      rationale: suggestion.rationale,
    }));
  }, [result]);

  const appliedState = useMemo(
    () => applyTailorSuggestions(selectedResumeText, patches, selectedSuggestionIds),
    [patches, selectedResumeText, selectedSuggestionIds]
  );

  useEffect(() => {
    if (!result) return;
    const key = `resume-tailor-selection:${selectedResumeId || "none"}`;
    const payload = {
      ids: Array.from(selectedSuggestionIds),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }, [result, selectedResumeId, selectedSuggestionIds]);

  useEffect(() => {
    if (!result) return;
    const key = `resume-tailor-selection:${selectedResumeId || "none"}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { ids?: string[] };
      if (!Array.isArray(parsed.ids)) return;
      const allowed = new Set(patches.map((patch) => patch.id));
      const ids = parsed.ids.filter((id) => allowed.has(id));
      if (ids.length > 0) setSelectedSuggestionIds(new Set(ids));
    } catch {
      // Ignore local parsing errors.
    }
  }, [patches, result, selectedResumeId]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl md:text-5xl">AI Resume Tailor</h1>

      <GlassCard className="p-5" tiltEnabled={false}>
        <div className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="resume-tailor-job-description">Job Description</Label>
            <Textarea
              id="resume-tailor-job-description"
              rows={8}
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste full job description here..."
            />
          </div>
          <MagneticButton onClick={() => void runTailor()} disabled={tailoring}>
            {tailoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tailoring...
              </>
            ) : (
              "Generate Tailored Edits"
            )}
          </MagneticButton>
        </div>
      </GlassCard>

      {!result ? (
        <EmptyState
          icon={<SplitSquareHorizontal className="h-5 w-5" />}
          title="No tailored edits yet"
          description="Generate side-by-side suggestions to align your resume with the role."
        />
      ) : (
        <div className="space-y-4">
          <GlassCard className="p-4" tiltEnabled={false}>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </GlassCard>
          <GlassCard className="p-4" tiltEnabled={false}>
            <div className="flex flex-wrap items-center gap-2">
              <MagneticButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedSuggestionIds(new Set(patches.map((patch) => patch.id)))}
              >
                Select all
              </MagneticButton>
              <MagneticButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedSuggestionIds(new Set())}
              >
                Clear
              </MagneticButton>
              <MagneticButton
                size="sm"
                className="gap-2"
                onClick={() => setExportOpen(true)}
                disabled={!appliedState.mergedText.trim()}
              >
                <Download className="h-4 w-4" />
                Export Fixed Resume PDF
              </MagneticButton>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Applied {appliedState.applied.length} of {patches.length} suggestions.
            </p>
            {appliedState.skipped.length > 0 ? (
              <p className="mt-1 text-xs text-amber-300">
                {appliedState.skipped.length} selected suggestions could not be auto-mapped and were skipped.
              </p>
            ) : null}
          </GlassCard>
          {result.suggestions.map((suggestion, index) => (
            <GlassCard key={`${suggestion.section}-${index}`} className="p-5" tiltEnabled={false}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{suggestion.section}</p>
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={selectedSuggestionIds.has(`s-${index}`)}
                    onChange={(event) => {
                      const id = `s-${index}`;
                      setSelectedSuggestionIds((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(id);
                        else next.delete(id);
                        return next;
                      });
                    }}
                  />
                  Apply
                </label>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Original</p>
                  <p className="mt-1 text-sm">{suggestion.original}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Suggested</p>
                  <p className="mt-1 text-sm text-primary">{suggestion.suggested}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{suggestion.rationale}</p>
            </GlassCard>
          ))}
          <GlassCard className="p-5" tiltEnabled={false}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Edited Resume Preview</p>
            <pre className="mt-2 max-h-[520px] overflow-auto whitespace-pre-wrap text-sm text-muted-foreground">
              {appliedState.mergedText}
            </pre>
          </GlassCard>
        </div>
      )}
      <ExportSettingsDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        defaultFilename={`fixed-resume-${new Date().toISOString().slice(0, 10)}`}
        payloadFactory={({ filename }) => ({
          feature: "resume-tailor",
          template: "premium-default",
          filename,
          includeMetadata: false,
          document: buildResumeTailorDocument({
            editedResume: appliedState.mergedText,
            appliedChanges: appliedState.applied.map((item) => `${item.section}: ${item.suggested}`),
          }),
        })}
      />
    </div>
  );
}
