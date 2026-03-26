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
import type { Project } from "@/types/database";

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

function parseTechStack(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function emptyDraft(): Omit<Project, "id" | "user_id" | "created_at"> {
  return {
    name: "",
    description: "",
    tech_stack: [],
    live_url: "",
    github_url: "",
    image_url: "",
    start_date: null,
    end_date: null,
    display_order: 0,
  };
}

export interface ProjectFormProps {
  projects: Project[];
  onProjectsChange: (next: Project[]) => void;
}

export function ProjectForm({ projects, onProjectsChange }: ProjectFormProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const resetForm = () => {
    const d = emptyDraft();
    setName(d.name);
    setDescription(d.description);
    setTechStackInput("");
    setLiveUrl(d.live_url);
    setGithubUrl(d.github_url);
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (row: Project) => {
    setEditingId(row.id);
    setName(row.name);
    setDescription(row.description ?? "");
    setTechStackInput((row.tech_stack ?? []).join(", "));
    setLiveUrl(row.live_url ?? "");
    setGithubUrl(row.github_url ?? "");
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tech_stack = parseTechStack(techStackInput);

      if (editingId) {
        const res = await fetch("/api/projects", {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            id: editingId,
            name,
            description,
            tech_stack,
            live_url: liveUrl,
            github_url: githubUrl,
          }),
        });
        const updated = await parseJsonResponse<Project>(res);
        onProjectsChange(
          projects.map((p) => (p.id === updated.id ? updated : p))
        );
        toast.success("Project updated.");
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            tech_stack,
            live_url: liveUrl,
            github_url: githubUrl,
            image_url: "",
            start_date: null,
            end_date: null,
            display_order: projects.length,
          }),
        });
        const created = await parseJsonResponse<Project>(res);
        onProjectsChange([...projects, created]);
        toast.success("Project added.");
      }
      handleDialogOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id }),
      });
      await parseJsonResponse<{ success: boolean }>(res);
      onProjectsChange(projects.filter((p) => p.id !== id));
      toast.success("Project removed.");
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
          Add Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <ul className="space-y-3">
          {projects.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-medium">{row.name}</p>
                {row.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">{row.description}</p>
                ) : null}
                {row.tech_stack?.length ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.tech_stack.join(" · ")}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Edit project"
                  onClick={() => openEdit(row)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Delete project"
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
            <DialogTitle>{editingId ? "Edit project" : "Add project"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Name</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-tech">Tech stack</Label>
              <Input
                id="proj-tech"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="React, TypeScript, Supabase"
              />
              <p className="text-xs text-muted-foreground">Comma-separated tags.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="proj-live">Live URL</Label>
                <Input
                  id="proj-live"
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-gh">GitHub URL</Label>
                <Input
                  id="proj-gh"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
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
