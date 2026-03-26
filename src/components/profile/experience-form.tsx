"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Experience } from "@/types/database";

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const data: unknown = await res.json();
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

function emptyDraft(): Omit<Experience, "id" | "user_id" | "created_at"> {
  return {
    company: "",
    title: "",
    location: "",
    start_date: null,
    end_date: null,
    description: "",
    is_internship: false,
    display_order: 0,
  };
}

export interface ExperienceFormProps {
  experience: Experience[];
  onExperienceChange: (next: Experience[]) => void;
}

export function ExperienceForm({
  experience,
  onExperienceChange,
}: ExperienceFormProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [present, setPresent] = useState(false);
  const [description, setDescription] = useState("");
  const [isInternship, setIsInternship] = useState(false);

  const resetForm = () => {
    const d = emptyDraft();
    setCompany(d.company);
    setTitle(d.title);
    setLocation(d.location);
    setStartDate("");
    setEndDate("");
    setPresent(false);
    setDescription(d.description);
    setIsInternship(d.is_internship);
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (row: Experience) => {
    setEditingId(row.id);
    setCompany(row.company);
    setTitle(row.title);
    setLocation(row.location);
    setStartDate(row.start_date ? row.start_date.slice(0, 10) : "");
    const isPresent = row.end_date === null;
    setPresent(isPresent);
    setEndDate(row.end_date ? row.end_date.slice(0, 10) : "");
    setDescription(row.description ?? "");
    setIsInternship(Boolean(row.is_internship));
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const start = startDate.trim() ? startDate : null;
      const end = present ? null : endDate.trim() ? endDate : null;

      if (editingId) {
        const res = await fetch("/api/experience", {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            id: editingId,
            company,
            title,
            location,
            start_date: start,
            end_date: end,
            description,
            is_internship: isInternship,
          }),
        });
        const updated = await parseJsonResponse<Experience>(res);
        onExperienceChange(
          experience.map((e) => (e.id === updated.id ? updated : e))
        );
        toast.success("Experience updated.");
      } else {
        const res = await fetch("/api/experience", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            company,
            title,
            location,
            start_date: start,
            end_date: end,
            description,
            is_internship: isInternship,
            display_order: experience.length,
          }),
        });
        const created = await parseJsonResponse<Experience>(res);
        onExperienceChange([...experience, created]);
        toast.success("Experience added.");
      }
      handleDialogOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save experience.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/experience", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id }),
      });
      await parseJsonResponse<{ success: boolean }>(res);
      onExperienceChange(experience.filter((e) => e.id !== id));
      toast.success("Experience removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" className="gap-1" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add Experience
        </Button>
      </div>

      {experience.length === 0 ? (
        <p className="text-sm text-muted-foreground">No experience entries yet.</p>
      ) : (
        <ul className="space-y-3">
          {experience.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {row.title} {row.is_internship ? "· Internship" : ""}
                </p>
                <p className="text-sm text-muted-foreground">{row.company}</p>
                {row.location ? (
                  <p className="text-xs text-muted-foreground">{row.location}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {[row.start_date, row.end_date ?? "Present"].filter(Boolean).join(" – ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Edit experience"
                  onClick={() => openEdit(row)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Delete experience"
                  disabled={deletingId === row.id}
                  onClick={() => void handleDelete(row.id)}
                >
                  {deletingId === row.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit experience" : "Add experience"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-company">Company</Label>
                <Input
                  id="exp-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-title">Title</Label>
                <Input
                  id="exp-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-location">Location</Label>
              <Input
                id="exp-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or Remote"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-start">Start date</Label>
                <Input
                  id="exp-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-end">End date</Label>
                <Input
                  id="exp-end"
                  type="date"
                  value={present ? "" : endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={present}
                />
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="exp-present"
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input"
                    checked={present}
                    onChange={(e) => {
                      setPresent(e.target.checked);
                      if (e.target.checked) setEndDate("");
                    }}
                  />
                  <Label htmlFor="exp-present" className="font-normal">
                    Present
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-desc">Description</Label>
              <Textarea
                id="exp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="exp-internship"
                type="checkbox"
                className="h-4 w-4 rounded border border-input"
                checked={isInternship}
                onChange={(e) => setIsInternship(e.target.checked)}
              />
              <Label htmlFor="exp-internship" className="font-normal">
                This was an internship
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
