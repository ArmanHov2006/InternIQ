"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS } from "@/lib/constants";
import type { Skill } from "@/types/database";

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

export interface SkillsFormProps {
  skills: Skill[];
  onSkillsChange: (next: Skill[]) => void;
}

export function SkillsForm({ skills, onSkillsChange }: SkillsFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(SKILL_CATEGORIES[0]);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a skill name.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: trimmed,
          category,
          display_order: skills.length,
        }),
      });
      const created = await parseJsonResponse<Skill>(res);
      onSkillsChange([...skills, created]);
      setName("");
      setCategory(SKILL_CATEGORIES[0]);
      toast.success("Skill added.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add skill.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      const res = await fetch("/api/skills", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id }),
      });
      await parseJsonResponse<{ success: boolean }>(res);
      onSkillsChange(skills.filter((s) => s.id !== id));
      toast.success("Skill removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove skill.");
    } finally {
      setRemovingId(null);
    }
  };

  const grouped = SKILL_CATEGORIES.map((cat) => ({
    cat,
    label: SKILL_CATEGORY_LABELS[cat] ?? cat,
    items: skills.filter((s) => s.category === cat),
  })).filter((g) => g.items.length > 0);

  const known = new Set<string>(SKILL_CATEGORIES);
  const uncategorized = skills.filter((s) => !known.has(s.category));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="skill-name">Skill name</Label>
            <Input
              id="skill-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TypeScript"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Skill category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {SKILL_CATEGORY_LABELS[c] ?? c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          className="sm:mb-0.5"
          onClick={() => void handleAdd()}
          disabled={adding}
        >
          {adding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding…
            </>
          ) : (
            "Add"
          )}
        </Button>
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No skills yet.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ cat, label, items }) => (
            <div key={cat}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((s) => (
                  <Badge key={s.id} variant="secondary" className="gap-1 pr-1">
                    <span>{s.name}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Remove ${s.name}`}
                      disabled={removingId === s.id}
                      onClick={() => void handleRemove(s.id)}
                    >
                      {removingId === s.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {uncategorized.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Other
              </p>
              <div className="flex flex-wrap gap-2">
                {uncategorized.map((s) => (
                  <Badge key={s.id} variant="outline" className="gap-1 pr-1">
                    <span>{s.name}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Remove ${s.name}`}
                      disabled={removingId === s.id}
                      onClick={() => void handleRemove(s.id)}
                    >
                      {removingId === s.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
