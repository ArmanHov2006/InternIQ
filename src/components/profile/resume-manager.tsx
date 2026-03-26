"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Resume } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const formatDate = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
};

export function ResumeManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingPrimaryId, setSavingPrimaryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumes", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const payload = (await res.json()) as Resume[] | { error?: string };
      if (!res.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Could not load resumes."
        );
      }
      setResumes(payload as Resume[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load resumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResumes();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toast.error("Resume must be 5MB or smaller.");
      return;
    }

    setUploading(true);
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
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Could not upload resume."
        );
      }
      setResumes((prev) => [payload as Resume, ...prev]);
      toast.success("Resume uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload resume.");
    } finally {
      setUploading(false);
    }
  };

  const setPrimary = async (resume: Resume) => {
    if (resume.is_primary) return;
    setSavingPrimaryId(resume.id);
    try {
      const res = await fetch("/api/resumes", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: resume.id, is_primary: true }),
      });
      const payload = (await res.json()) as Resume | { error?: string };
      if (!res.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Could not update primary resume."
        );
      }

      setResumes((prev) =>
        prev.map((item) =>
          item.id === resume.id ? ({ ...item, is_primary: true } as Resume) : { ...item, is_primary: false }
        )
      );
      toast.success("Primary resume updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update primary resume.");
    } finally {
      setSavingPrimaryId(null);
    }
  };

  const deleteResume = async (resume: Resume) => {
    if (!window.confirm(`Delete "${resume.file_name}"?`)) return;

    setDeletingId(resume.id);
    try {
      const res = await fetch("/api/resumes", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: resume.id }),
      });
      const payload = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Could not delete resume.");
      }
      setResumes((prev) => prev.filter((item) => item.id !== resume.id));
      toast.success("Resume deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete resume.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading resumes...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Upload a resume to use AI features in Analyze and Email pages.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => void handleUpload(e)}
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Resume
            </>
          )}
        </Button>
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Upload a resume to use AI features.
        </div>
      ) : (
        <div className="space-y-2">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-colors duration-150 hover:bg-accent/30"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{resume.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  Uploaded {formatDate(resume.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {resume.is_primary ? <Badge>Primary</Badge> : null}
                <Button
                  type="button"
                  size="icon"
                  variant={resume.is_primary ? "secondary" : "outline"}
                  disabled={savingPrimaryId === resume.id || deletingId === resume.id}
                  onClick={() => void setPrimary(resume)}
                  aria-label={`Set ${resume.file_name} as primary resume`}
                  title="Set as primary"
                >
                  {savingPrimaryId === resume.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  disabled={deletingId === resume.id || savingPrimaryId === resume.id}
                  onClick={() => void deleteResume(resume)}
                  aria-label={`Delete resume ${resume.file_name}`}
                  title="Delete resume"
                >
                  {deletingId === resume.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
