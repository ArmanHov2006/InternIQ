"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, RefreshCw, Save } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type GeneratedEmail = {
  subject: string;
  body: string;
};

type SaveMode = "new" | "existing";

type ColdEmailGeneratorProps = {
  result: GeneratedEmail;
  jobUrl: string;
  defaultCompany: string;
  defaultRole: string;
  defaultContactName?: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
};

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

export function ColdEmailGenerator({
  result,
  jobUrl,
  defaultCompany,
  defaultRole,
  defaultContactName = "",
  onRegenerate,
  regenerating = false,
}: ColdEmailGeneratorProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [mode, setMode] = useState<SaveMode>("new");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [company, setCompany] = useState(defaultCompany);
  const [role, setRole] = useState(defaultRole);
  const [contactName, setContactName] = useState(defaultContactName);

  useEffect(() => {
    setCompany(defaultCompany);
  }, [defaultCompany]);
  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);
  useEffect(() => {
    setContactName(defaultContactName);
  }, [defaultContactName]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

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
      const apps = payload as Application[];
      setApplications(apps);
      setSelectedId(apps[0]?.id ?? "");
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
            contact_name: contactName.trim(),
            generated_email: `Subject: ${result.subject}\n\n${result.body}`,
          }),
        });
        const payload = await createRes.json();
        if (!createRes.ok) {
          throw new Error(parseApiError(payload, "Could not save generated email."));
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
            generated_email: `Subject: ${result.subject}\n\n${result.body}`,
            contact_name: contactName.trim(),
          }),
        });
        const payload = await updateRes.json();
        if (!updateRes.ok) {
          throw new Error(parseApiError(payload, "Could not save generated email."));
        }
      }

      toast.success("Generated email saved to application.");
      setSaveOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save generated email.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Cold Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">Subject</p>
          <p className="mt-1 text-sm font-semibold">{result.subject}</p>
        </div>

        <div className="rounded-lg border bg-card p-6 font-mono text-[13px] leading-relaxed shadow-inner">
          <p className="whitespace-pre-wrap">{result.body}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button type="button" variant="outline" onClick={() => void copyText(result.subject, "Subject")}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Subject
          </Button>
          <Button type="button" variant="outline" onClick={() => void copyText(result.body, "Body")}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Body
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void copyText(`Subject: ${result.subject}\n\n${result.body}`, "Email")
            }
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy All
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={onRegenerate} disabled={regenerating || !onRegenerate}>
            {regenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </>
            )}
          </Button>
          <Button type="button" onClick={() => void openSaveDialog()}>
            <Save className="mr-2 h-4 w-4" />
            Save to Application
          </Button>
        </div>
      </CardContent>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-[600px] w-full">
          <DialogHeader>
            <DialogTitle>Save Generated Email</DialogTitle>
            <DialogDescription>
              Save this generated email to a new or existing application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Save mode</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as SaveMode)}>
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
                  <Label htmlFor="email-company">Company</Label>
                  <Input
                    id="email-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-role">Role</Label>
                  <Input
                    id="email-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
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
              <Label htmlFor="email-contact-name">Contact name (optional)</Label>
              <Input
                id="email-contact-name"
                placeholder="Hiring Manager"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
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
