"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Loader2, Upload } from "lucide-react";
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
import { buildCoverLetterDocument } from "@/lib/pdf/renderers/feature-renderers";

type CoverLetterResult = {
  title: string;
  content: string;
};

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export default function CoverLetterPage() {
  const [jobUrl, setJobUrl] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "enthusiastic">("professional");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
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

  const generateLetter = async () => {
    if (!jobUrl.trim() || !company.trim() || !role.trim() || !selectedResumeText) {
      toast.error("Complete all fields and select a resume.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          job_url: jobUrl.trim(),
          resume_text: selectedResumeText,
          company: company.trim(),
          role: role.trim(),
          tone,
        }),
      });
      const payload = (await res.json()) as CoverLetterResult | { error?: string };
      if (!res.ok) throw new Error(("error" in payload && payload.error) || "Failed to generate.");
      setResult(payload as CoverLetterResult);
      toast.success("Cover letter generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl md:text-5xl">AI Cover Letter</h1>
      <GlassCard className="p-5" tiltEnabled={false}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cover-job-url">Job URL</Label>
            <Input id="cover-job-url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover-company">Company</Label>
            <Input id="cover-company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover-role">Role</Label>
            <Input id="cover-role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(value) => setTone(value as typeof tone)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:col-span-2 md:grid-cols-[1fr_auto]">
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
        </div>
        <div className="mt-4 flex gap-3">
          <MagneticButton onClick={() => void generateLetter()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Cover Letter"
            )}
          </MagneticButton>
          {result ? (
            <MagneticButton variant="outline" className="gap-2" onClick={() => setExportOpen(true)}>
              <Download className="h-4 w-4" />
              Export to PDF
            </MagneticButton>
          ) : null}
        </div>
      </GlassCard>

      {!result ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No cover letter yet"
          description="Generate a tailored cover letter from your resume and target job."
        />
      ) : (
        <div className="mx-auto max-w-3xl rounded-xl border border-black/10 bg-white p-10 text-black shadow-xl">
          <h2 className="text-xl font-semibold">{result.title}</h2>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7">{result.content}</pre>
        </div>
      )}
      <ExportSettingsDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        defaultFilename={`cover-letter-${new Date().toISOString().slice(0, 10)}`}
        payloadFactory={({ filename, includeMetadata }) => ({
          feature: "cover-letter",
          template: "premium-default",
          filename,
          includeMetadata,
          document: buildCoverLetterDocument({
            title: result?.title ?? "Cover Letter",
            content: result?.content ?? "",
            company: company.trim(),
            role: role.trim(),
            tone,
          }),
        })}
      />
    </div>
  );
}
