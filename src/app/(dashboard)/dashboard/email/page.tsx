"use client";

import { useMemo, useState } from "react";
import { Loader2, MailOpen, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { ColdEmailGenerator, type GeneratedEmail } from "@/components/ai/cold-email-generator";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMAIL_TEMPLATES, buildEmailFromTemplate } from "@/lib/services/email-templates";
import type { EmailTemplateId } from "@/types/local-features";
import { useEmailStore } from "@/stores/email-store";
import { useAnalyzeStore } from "@/stores/analyze-store";

export default function EmailPage() {
  const [recipientName, setRecipientName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [templateId, setTemplateId] = useState<EmailTemplateId>("networking_intro");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedEmail | null>(null);
  const { history, activeEmailId, saveGeneratedEmail, setActiveEmail, updateEmailDraft, removeEmail, clearHistory } =
    useEmailStore();
  const resumes = useAnalyzeStore((state) => state.resumes);

  const selectedHistoryItem = useMemo(
    () => history.find((entry) => entry.id === activeEmailId) ?? null,
    [history, activeEmailId]
  );

  const runGenerate = async () => {
    if (!recipientName.trim() || !company.trim() || !role.trim()) {
      toast.error("Recipient name, company, and role are required.");
      return;
    }

    setGenerating(true);
    try {
      const generated = buildEmailFromTemplate(templateId, {
        recipientName: recipientName.trim(),
        company: company.trim(),
        role: role.trim(),
        sellingPoints: sellingPoints.trim(),
      });
      saveGeneratedEmail({
        templateId,
        recipientName: recipientName.trim(),
        company: company.trim(),
        role: role.trim(),
        sellingPoints: sellingPoints.trim(),
        subject: generated.subject,
        body: generated.body,
      });
      setResult(generated);
      toast.success("Email generated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate email.";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl md:text-5xl">Cold Email Generator</h1>
      <GlassCard className="p-5" tiltEnabled={false}>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email-recipient-name">Recipient Name</Label>
              <Input
                id="email-recipient-name"
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                placeholder="Hiring manager or recruiter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-template">Template</Label>
              <Select value={templateId} onValueChange={(value) => setTemplateId(value as EmailTemplateId)}>
                <SelectTrigger id="email-template">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email-company">Company</Label>
              <Input
                id="email-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-role">Role</Label>
              <Input
                id="email-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Job title or role"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-selling-points">Your Key Selling Points</Label>
            <Textarea
              id="email-selling-points"
              rows={4}
              value={sellingPoints}
              onChange={(event) => setSellingPoints(event.target.value)}
              placeholder="What should be highlighted? e.g. built a Next.js app, strong TypeScript, leadership in hackathon..."
            />
          </div>

          <div className="glass rounded-xl p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Pull from stored resume context (optional)
              </p>
              <MagneticButton
                size="sm"
                variant="outline"
                onClick={() => {
                  const primary = resumes.find((resume) => resume.isPrimary) ?? resumes[0];
                  if (!primary?.text.trim()) {
                    toast.error("No stored resume text found in local storage.");
                    return;
                  }
                  const snippet = primary.text.split(/\.\s+/).slice(0, 3).join(". ").slice(0, 450).trim();
                  setSellingPoints((prev) => (prev.trim() ? `${prev}\n\n${snippet}` : snippet));
                  toast.success("Added resume context.");
                }}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Use Resume Context
              </MagneticButton>
            </div>
          </div>

          {generating ? (
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Generating your draft...</p>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {EMAIL_TEMPLATES.find((template) => template.id === templateId)?.description}
              </p>
            </div>
            <div className="self-end">
              <div className="flex gap-2" />
            </div>
          </div>

          <MagneticButton onClick={() => void runGenerate()} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Email"
            )}
          </MagneticButton>
        </div>
      </GlassCard>

      {history.length > 0 ? (
        <GlassCard className="p-4" tiltEnabled={false}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Generated History</p>
            <MagneticButton size="sm" variant="outline" onClick={clearHistory}>
              Clear History
            </MagneticButton>
          </div>
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="glass flex items-center justify-between rounded-lg p-3">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => {
                  setActiveEmail(entry.id);
                  setResult({ subject: entry.subject, body: entry.body });
                }}>
                  <p className="truncate text-sm font-medium">
                    {entry.company} · {entry.role}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{entry.subject}</p>
                </button>
                <MagneticButton variant="ghost" size="sm" onClick={() => removeEmail(entry.id)}>
                  Delete
                </MagneticButton>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}

      {!result && !selectedHistoryItem ? (
        <EmptyState
          icon={<MailOpen className="h-5 w-5" />}
          title="No emails generated yet"
          description="Generate personalized outreach drafts from reusable templates and save them in local history."
        />
      ) : (
        <div className="space-y-3">
          <ColdEmailGenerator
            result={result ?? { subject: selectedHistoryItem?.subject ?? "", body: selectedHistoryItem?.body ?? "" }}
            onChange={(next) => {
              setResult(next);
              if (activeEmailId) {
                updateEmailDraft(activeEmailId, next);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
