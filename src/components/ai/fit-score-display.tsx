"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Application } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GapGlyph,
  IconFrame,
  StrengthGlyph,
  SuggestionGlyph,
} from "@/components/ui/icons/premium-icons";

export type AnalyzeResult = {
  fit_score: number;
  analysis: {
    strengths: string[];
    gaps: string[];
    suggestions: string[];
    summary: string;
  };
};

type FitScoreDisplayProps = {
  result: AnalyzeResult;
  jobUrl: string;
  showSaveAction?: boolean;
};

type SaveMode = "new" | "existing";

const parseApiError = (payload: unknown, fallback: string): string => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
};

const scoreColorClass = (score: number): string => {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
};

const scoreStrokeClass = (score: number): string => {
  if (score >= 70) return "stroke-green-600";
  if (score >= 40) return "stroke-yellow-600";
  return "stroke-red-600";
};

export function FitScoreDisplay({ result, jobUrl, showSaveAction = true }: FitScoreDisplayProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [mode, setMode] = useState<SaveMode>("new");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [personalNote, setPersonalNote] = useState("");

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, result.fit_score));
  const progress = circumference - (normalizedScore / 100) * circumference;

  const analysisText = useMemo(() => {
    return JSON.stringify(result.analysis);
  }, [result.analysis]);

  const stickyNoteClass =
    "rounded-md border border-amber-300 bg-amber-50 p-3 shadow-sm";

  const openSaveDialog = async () => {
    setSaveOpen(true);
    setLoadingApps(true);
    try {
      const res = await fetch("/api/applications", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const payload = (await res.json()) as Application[] | { error?: string };
      if (!res.ok) {
        throw new Error(parseApiError(payload, "Could not load applications."));
      }
      setApplications(payload as Application[]);
      const first = (payload as Application[])[0];
      setSelectedId(first?.id ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load applications.");
    } finally {
      setLoadingApps(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === "new") {
        if (!company.trim() || !role.trim()) {
          toast.error("Company and role are required.");
          setSaving(false);
          return;
        }
        const createRes = await fetch("/api/applications", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            company: company.trim(),
            role: role.trim(),
            job_url: jobUrl,
            fit_score: result.fit_score,
            fit_analysis: analysisText,
            notes: personalNote.trim(),
          }),
        });
        const createPayload = await createRes.json();
        if (!createRes.ok) {
          throw new Error(parseApiError(createPayload, "Could not save analysis."));
        }
      } else {
        if (!selectedId) {
          toast.error("Select an application to update.");
          setSaving(false);
          return;
        }
        const updateRes = await fetch("/api/applications", {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            id: selectedId,
            fit_score: result.fit_score,
            fit_analysis: analysisText,
            notes: (() => {
              const selected = applications.find((application) => application.id === selectedId);
              const base = selected?.notes?.trim() ?? "";
              const addon = personalNote.trim();
              if (!addon) return base;
              return base ? `${base}\n\n${addon}` : addon;
            })(),
          }),
        });
        const updatePayload = await updateRes.json();
        if (!updateRes.ok) {
          throw new Error(parseApiError(updatePayload, "Could not save analysis."));
        }
      }

      toast.success("Analysis saved to application.");
      setSaveOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save analysis.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fit Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="relative h-36 w-36">
            <svg className="h-36 w-36 -rotate-90" viewBox="0 0 140 140" aria-hidden>
              <circle cx="70" cy="70" r={radius} strokeWidth="12" className="fill-none stroke-muted" />
              <circle
                cx="70"
                cy="70"
                r={radius}
                strokeWidth="12"
                strokeLinecap="round"
                className={`fill-none ${scoreStrokeClass(normalizedScore)}`}
                strokeDasharray={circumference}
                strokeDashoffset={progress}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-3xl font-bold ${scoreColorClass(normalizedScore)}`}>
                  {normalizedScore}
                </p>
                <p className="text-xs text-muted-foreground">out of 100</p>
              </div>
            </div>
          </div>
        </div>

        <div className={stickyNoteClass}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Summary
          </p>
          <p className="text-sm text-amber-900">{result.analysis.summary}</p>
        </div>

        <section className={`space-y-2 ${stickyNoteClass}`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <IconFrame className="h-6 w-6 rounded-md border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
              <StrengthGlyph />
            </IconFrame>
            Strengths
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
            {result.analysis.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={`space-y-2 ${stickyNoteClass}`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <IconFrame className="h-6 w-6 rounded-md border-rose-400/30 bg-rose-500/10 text-rose-300">
              <GapGlyph />
            </IconFrame>
            Gaps
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
            {result.analysis.gaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={`space-y-2 ${stickyNoteClass}`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <IconFrame className="h-6 w-6 rounded-md border-amber-300/30 bg-amber-500/10 text-amber-200">
              <SuggestionGlyph />
            </IconFrame>
            Suggestions
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
            {result.analysis.suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {showSaveAction ? (
          <Button type="button" className="w-full" onClick={() => void openSaveDialog()}>
            Save to Application
          </Button>
        ) : null}
      </CardContent>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-[600px] w-full">
          <DialogHeader>
            <DialogTitle>Save Analysis</DialogTitle>
            <DialogDescription>
              Save this fit score to a new or existing application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Save mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as SaveMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Create new application</SelectItem>
                  <SelectItem value="existing">Update existing application</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "new" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-company">Company</Label>
                  <Input
                    id="new-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">Role</Label>
                  <Input
                    id="new-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Job title or role"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Application</Label>
                <Select value={selectedId} onValueChange={setSelectedId} disabled={loadingApps}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingApps ? "Loading..." : "Select application"} />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((application) => (
                      <SelectItem key={application.id} value={application.id}>
                        {application.company} - {application.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="analysis-personal-note">Personal Note (post-it)</Label>
              <Textarea
                id="analysis-personal-note"
                rows={3}
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="Add your own quick note to save with this analysis..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
