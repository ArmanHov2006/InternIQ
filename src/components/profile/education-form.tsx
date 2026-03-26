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
import type { Education } from "@/types/database";

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

function emptyDraft(): Omit<Education, "id" | "user_id" | "created_at"> {
  return {
    school: "",
    degree: "",
    field_of_study: "",
    start_date: null,
    end_date: null,
    gpa: "",
    description: "",
    display_order: 0,
  };
}

export interface EducationFormProps {
  education: Education[];
  onEducationChange: (next: Education[]) => void;
}

export function EducationForm({ education, onEducationChange }: EducationFormProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [present, setPresent] = useState(false);
  const [gpa, setGpa] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    const d = emptyDraft();
    setSchool(d.school);
    setDegree(d.degree);
    setFieldOfStudy(d.field_of_study);
    setStartDate("");
    setEndDate("");
    setPresent(false);
    setGpa(d.gpa);
    setDescription(d.description);
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (row: Education) => {
    setEditingId(row.id);
    setSchool(row.school);
    setDegree(row.degree);
    setFieldOfStudy(row.field_of_study);
    setStartDate(row.start_date ? row.start_date.slice(0, 10) : "");
    const isPresent = row.end_date === null;
    setPresent(isPresent);
    setEndDate(row.end_date ? row.end_date.slice(0, 10) : "");
    setGpa(row.gpa ?? "");
    setDescription(row.description ?? "");
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
        const res = await fetch("/api/education", {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            id: editingId,
            school,
            degree,
            field_of_study: fieldOfStudy,
            start_date: start,
            end_date: end,
            gpa,
            description,
          }),
        });
        const updated = await parseJsonResponse<Education>(res);
        onEducationChange(
          education.map((e) => (e.id === updated.id ? updated : e))
        );
        toast.success("Education updated.");
      } else {
        const res = await fetch("/api/education", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            school,
            degree,
            field_of_study: fieldOfStudy,
            start_date: start,
            end_date: end,
            gpa,
            description,
            display_order: education.length,
          }),
        });
        const created = await parseJsonResponse<Education>(res);
        onEducationChange([...education, created]);
        toast.success("Education added.");
      }
      handleDialogOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save education.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/education", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id }),
      });
      await parseJsonResponse<{ success: boolean }>(res);
      onEducationChange(education.filter((e) => e.id !== id));
      toast.success("Education removed.");
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
          Add Education
        </Button>
      </div>

      {education.length === 0 ? (
        <p className="text-sm text-muted-foreground">No education entries yet.</p>
      ) : (
        <ul className="space-y-3">
          {education.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-medium">{row.school}</p>
                <p className="text-sm text-muted-foreground">
                  {row.degree}
                  {row.field_of_study ? ` · ${row.field_of_study}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[row.start_date, row.end_date ?? "Present"].filter(Boolean).join(" – ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Edit education"
                  onClick={() => openEdit(row)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Delete education"
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
            <DialogTitle>{editingId ? "Edit education" : "Add education"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="edu-school">School</Label>
              <Input
                id="edu-school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edu-degree">Degree</Label>
                <Input
                  id="edu-degree"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edu-field">Field of study</Label>
                <Input
                  id="edu-field"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edu-start">Start date</Label>
                <Input
                  id="edu-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edu-end">End date</Label>
                <Input
                  id="edu-end"
                  type="date"
                  value={present ? "" : endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={present}
                />
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="edu-present"
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input"
                    checked={present}
                    onChange={(e) => {
                      setPresent(e.target.checked);
                      if (e.target.checked) setEndDate("");
                    }}
                  />
                  <Label htmlFor="edu-present" className="font-normal">
                    Present
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-gpa">GPA</Label>
              <Input
                id="edu-gpa"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-desc">Description</Label>
              <Textarea
                id="edu-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
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
