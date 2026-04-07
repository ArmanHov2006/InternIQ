"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Pencil, PlusCircle, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Resume } from "@/types/database";
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
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type StatusNotice = {
  tone: "success" | "error";
  message: string;
  offerManualText?: boolean;
};

type ManualEditorState = {
  id: string | null;
  fileName: string;
  parsedText: string;
  isPrimary: boolean;
};

const emptyEditor = (): ManualEditorState => ({
  id: null,
  fileName: "",
  parsedText: "",
  isPrimary: false,
});

const sourceLabel = (resume: Resume): string => (resume.source_type === "manual" ? "Manual" : "PDF");

export function ResumesSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [updatingPrimaryId, setUpdatingPrimaryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<ManualEditorState>(emptyEditor);
  const [statusNotice, setStatusNotice] = useState<StatusNotice | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumes", { credentials: "same-origin" });
      const payload = (await res.json()) as Resume[] | { error?: string };
      if (!res.ok || !Array.isArray(payload)) {
        throw new Error(Array.isArray(payload) ? "Could not load resumes." : payload.error || "Could not load resumes.");
      }
      setResumes(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load resumes.";
      setStatusNotice({ tone: "error", message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openManualEditor = (seed?: Partial<ManualEditorState>) => {
    setEditor({
      ...emptyEditor(),
      ...seed,
    });
    setEditorOpen(true);
  };

  const closeEditor = (open: boolean) => {
    setEditorOpen(open);
    if (!open && !savingManual) {
      setEditor(emptyEditor());
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      const message = "Please upload a PDF resume.";
      setStatusNotice({ tone: "error", message, offerManualText: true });
      toast.error(message);
      return;
    }

    setUploading(true);
    setStatusNotice(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/resumes", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const payload = (await res.json()) as Resume | { error?: string };
      if (!res.ok || !("id" in payload)) {
        const message =
          "error" in payload && payload.error ? payload.error : "Resume upload failed.";
        throw new Error(message);
      }

      setStatusNotice({
        tone: "success",
        message: "Resume uploaded and parsed successfully.",
      });
      toast.success("Resume uploaded.");
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setStatusNotice({
        tone: "error",
        message,
        offerManualText: /extractable text/i.test(message),
      });
      if (/extractable text/i.test(message)) {
        openManualEditor({
          fileName: file.name.replace(/\.pdf$/i, "") || "Manual Resume",
          isPrimary: resumes.length === 0,
        });
      }
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const onSaveManual = async () => {
    setSavingManual(true);
    setStatusNotice(null);

    try {
      const body = {
        ...(editor.id ? { id: editor.id } : {}),
        file_name: editor.fileName,
        parsed_text: editor.parsedText,
        is_primary: editor.isPrimary,
      };
      const res = await fetch("/api/resumes", {
        method: editor.id ? "PUT" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as Resume | { error?: string };
      if (!res.ok || !("id" in payload)) {
        const message =
          "error" in payload && payload.error ? payload.error : "Could not save manual resume.";
        throw new Error(message);
      }

      const message = editor.id
        ? "Manual resume updated."
        : "Manual resume saved.";
      setStatusNotice({ tone: "success", message });
      toast.success(message);
      setEditorOpen(false);
      setEditor(emptyEditor());
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save manual resume.";
      setStatusNotice({ tone: "error", message });
      toast.error(message);
    } finally {
      setSavingManual(false);
    }
  };

  const onDelete = async (resume: Resume) => {
    setDeletingId(resume.id);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/resumes", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resume.id }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Delete failed");
      }
      setStatusNotice({
        tone: "success",
        message: `${resume.file_name} removed.`,
      });
      toast.success("Resume removed.");
      setResumes((rows) => rows.filter((row) => row.id !== resume.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed.";
      setStatusNotice({ tone: "error", message });
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const onMakePrimary = async (resume: Resume) => {
    if (resume.is_primary) return;
    setUpdatingPrimaryId(resume.id);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/resumes", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resume.id, is_primary: true }),
      });
      const payload = (await res.json()) as Resume | { error?: string };
      if (!res.ok || !("id" in payload)) {
        const message =
          "error" in payload && payload.error ? payload.error : "Could not update primary resume.";
        throw new Error(message);
      }
      setStatusNotice({
        tone: "success",
        message: `${resume.file_name} is now your primary resume.`,
      });
      toast.success("Primary resume updated.");
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update primary resume.";
      setStatusNotice({ tone: "error", message });
      toast.error(message);
    } finally {
      setUpdatingPrimaryId(null);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Your resumes</h3>
          <p className="text-sm text-muted-foreground">
            PDF uploads and pasted resume text both power discovery, tailoring, and AI analysis.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              void onUpload(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={uploading}
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload PDF
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-2"
            type="button"
            onClick={() =>
              openManualEditor({
                isPrimary: resumes.length === 0,
              })
            }
          >
            <PlusCircle className="h-4 w-4" />
            Paste Resume Text
          </Button>
        </div>
      </div>

      {statusNotice ? (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            statusNotice.tone === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{statusNotice.message}</p>
            {statusNotice.offerManualText ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-current text-current hover:bg-white/10"
                onClick={() =>
                  openManualEditor({
                    isPrimary: resumes.length === 0,
                  })
                }
              >
                Paste Instead
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loadingâ€¦</p>
      ) : resumes.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          No resumes yet. Upload a PDF or paste your resume text to get started.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {resumes.map((resume) => (
            <li key={resume.id} className="rounded-lg border border-border px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {resume.file_name || "Resume"}
                    </span>
                    <Badge variant="secondary">{sourceLabel(resume)}</Badge>
                    {resume.is_primary ? <Badge variant="outline">Primary</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(resume.updated_at ?? resume.created_at).toLocaleDateString()} •{" "}
                    {resume.source_type === "manual" ? "Editable text entry" : "Parsed from uploaded PDF"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!resume.is_primary ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updatingPrimaryId === resume.id}
                      onClick={() => void onMakePrimary(resume)}
                    >
                      {updatingPrimaryId === resume.id ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Star className="mr-1 h-4 w-4" />
                      )}
                      Make Primary
                    </Button>
                  ) : null}
                  {resume.source_type === "manual" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openManualEditor({
                          id: resume.id,
                          fileName: resume.file_name,
                          parsedText: resume.parsed_text,
                          isPrimary: resume.is_primary,
                        })
                      }
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    disabled={deletingId === resume.id}
                    onClick={() => void onDelete(resume)}
                    aria-label="Delete resume"
                  >
                    {deletingId === resume.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editorOpen} onOpenChange={closeEditor}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editor.id ? "Edit manual resume" : "Paste resume text"}</DialogTitle>
            <DialogDescription>
              Use this when a PDF cannot be parsed cleanly, or when you want discovery to use the exact text you provide.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="resume-name">Resume label</Label>
              <Input
                id="resume-name"
                value={editor.fileName}
                onChange={(e) => setEditor((current) => ({ ...current, fileName: e.target.value }))}
                placeholder="Backend Resume"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resume-text">Resume text</Label>
              <Textarea
                id="resume-text"
                value={editor.parsedText}
                onChange={(e) => setEditor((current) => ({ ...current, parsedText: e.target.value }))}
                placeholder="Paste the full text of your resume here..."
                className="min-h-[320px]"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-border"
                checked={editor.isPrimary}
                onChange={(e) => setEditor((current) => ({ ...current, isPrimary: e.target.checked }))}
              />
              Make this my primary resume for discovery and AI tailoring
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => closeEditor(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={savingManual} onClick={() => void onSaveManual()}>
              {savingManual ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {editor.id ? "Save Changes" : "Save Manual Resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
