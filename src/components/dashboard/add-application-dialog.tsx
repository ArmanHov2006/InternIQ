"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { Application } from "@/types/database";
import { Button } from "@/components/ui/button";
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

type FormState = {
  company: string;
  role: string;
  job_url: string;
  status: Application["status"];
  location: string;
  salary_range: string;
  notes: string;
  contact_name: string;
  contact_email: string;
};

const INITIAL_FORM: FormState = {
  company: "",
  role: "",
  job_url: "",
  status: "saved",
  location: "",
  salary_range: "",
  notes: "",
  contact_name: "",
  contact_email: "",
};

type AddApplicationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (application: Application) => void;
};

export function AddApplicationDialog({
  open,
  onOpenChange,
  onCreated,
}: AddApplicationDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setForm(INITIAL_FORM);
  }, [open]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.company.trim() || !form.role.trim()) {
      toast.error("Company and role are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...form,
          company: form.company.trim(),
          role: form.role.trim(),
        }),
      });
      const payload = (await res.json()) as Application | { error?: string };
      if (!res.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Could not create application."
        );
      }

      onCreated(payload as Application);
      onOpenChange(false);
      toast.success("Application added.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-full">
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
          <DialogDescription>
            Add a new application to your tracker.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-company">Company</Label>
              <Input
                id="app-company"
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
                placeholder="Stripe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-role">Role</Label>
              <Input
                id="app-role"
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                placeholder="Job title or role"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-job-url">Job URL</Label>
            <Input
              id="app-job-url"
              value={form.job_url}
              onChange={(e) => setField("job_url", e.target.value)}
              placeholder="https://jobs.example.com/..."
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setField("status", v as Application["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-location">Location</Label>
              <Input
                id="app-location"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Toronto, ON"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-salary">Salary Range</Label>
              <Input
                id="app-salary"
                value={form.salary_range}
                onChange={(e) => setField("salary_range", e.target.value)}
                placeholder="$25-35/hr"
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-contact-name">Contact Name</Label>
              <Input
                id="app-contact-name"
                value={form.contact_name}
                onChange={(e) => setField("contact_name", e.target.value)}
                placeholder="Hiring Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-contact-email">Contact Email</Label>
              <Input
                id="app-contact-email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setField("contact_email", e.target.value)}
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-notes">Notes</Label>
            <Textarea
              id="app-notes"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={4}
              placeholder="Important details, referral info, follow-up reminders..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
