"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiscoveryPreferences, RemotePreference } from "@/types/database";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDiscoverStore } from "@/stores/discover-store";
import { toast } from "sonner";
import { EditableContextChipList } from "./context-chip-editor";

interface PreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startInAdvanced?: boolean;
}

const parseList = (raw: string): string[] =>
  raw
    .split(/[,;\n]+/)
    .map((value) => value.trim())
    .filter(Boolean);

const uniqueNonEmpty = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const normalizeForCompare = (values: string[]) =>
  uniqueNonEmpty(values).map((value) => value.toLowerCase()).sort();

const sameValues = (left: string[], right: string[]) => {
  const a = normalizeForCompare(left);
  const b = normalizeForCompare(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
};

const formatPreview = (values: string[], fallback: string, limit = 3) =>
  values.length > 0 ? values.slice(0, limit).join(", ") : fallback;

export const PreferencesDialog = ({
  open,
  onOpenChange,
  startInAdvanced = false,
}: PreferencesDialogProps) => {
  const preferences = useDiscoverStore((state) => state.preferences);
  const setPreferences = useDiscoverStore((state) => state.setPreferences);
  const fetchPreferences = useDiscoverStore((state) => state.fetchPreferences);

  const [skills, setSkills] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [roleTypes, setRoleTypes] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const [remote, setRemote] = useState<RemotePreference>("any");
  const [excluded, setExcluded] = useState("");
  const [slugs, setSlugs] = useState("");
  const [minScore, setMinScore] = useState(55);
  const [active, setActive] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  const preview = preferences?.resume_context_preview;
  const detectedSkills = useMemo(
    () => uniqueNonEmpty(preview?.detected_skills ?? []),
    [preview?.detected_skills]
  );
  const detectedLocations = useMemo(
    () => uniqueNonEmpty(preview?.detected_locations ?? []),
    [preview?.detected_locations]
  );
  const detectedRoleTypes = useMemo(
    () => uniqueNonEmpty(preview?.detected_role_types ?? []),
    [preview?.detected_role_types]
  );

  useEffect(() => {
    if (!preferences || !open) return;

    setSkills(
      uniqueNonEmpty([
        ...(preferences.resume_context_preview?.effective_skills ?? []),
        ...preferences.keywords,
      ])
    );
    setLocations(
      uniqueNonEmpty([
        ...(preferences.resume_context_preview?.effective_locations ?? []),
        ...preferences.locations,
      ])
    );
    setRoleTypes(
      uniqueNonEmpty([
        ...(preferences.resume_context_preview?.effective_role_types ?? []),
        ...preferences.role_types,
      ])
    );
    setNote(preferences.resume_context_overrides.note);

    setRemote(preferences.remote_preference);
    setExcluded(preferences.excluded_companies.join(", "));
    setSlugs(preferences.greenhouse_slugs.join(", "));
    setMinScore(preferences.min_match_score);
    setActive(preferences.is_active);
    setShowAdvanced(startInAdvanced);
  }, [preferences, open, startInAdvanced]);

  const customized = useMemo(
    () =>
      !sameValues(skills, detectedSkills) ||
      !sameValues(locations, detectedLocations) ||
      !sameValues(roleTypes, detectedRoleTypes) ||
      note.trim().length > 0,
    [detectedLocations, detectedRoleTypes, detectedSkills, locations, note, roleTypes, skills]
  );

  const localSummary = useMemo(() => {
    const skillsText = formatPreview(skills, "broad discovery terms");
    const locationText = locations.length > 0 ? ` around ${formatPreview(locations, "your preferred locations", 2)}` : "";
    const roleText = roleTypes.length > 0 ? ` for ${formatPreview(roleTypes, "your preferred roles")} roles` : "";
    const noteText = note.trim() ? " Your note will also guide the search." : "";

    if (!preview?.has_resume) {
      return `No resume was detected, so Discover will use the context you save here for ${skillsText}${locationText}${roleText}.${noteText}`;
    }

    if (!customized) {
      return `These fields are prefilled from your latest resume. Discover will use ${skillsText}${locationText}${roleText}.${noteText}`;
    }

    return `You are overriding the resume defaults. Discover will use ${skillsText}${locationText}${roleText}.${noteText}`;
  }, [customized, locations, note, preview?.has_resume, roleTypes, skills]);

  const resetToResume = () => {
    setSkills(detectedSkills);
    setLocations(detectedLocations);
    setRoleTypes(detectedRoleTypes);
    setNote("");
    setLiveMessage("Context reset to your latest resume.");
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const body = {
        keywords: [],
        locations: [],
        remote_preference: remote,
        role_types: [],
        excluded_companies: parseList(excluded),
        greenhouse_slugs: parseList(slugs).map((value) => value.toLowerCase().replace(/\s+/g, "-")),
        min_match_score: minScore,
        resume_context_enabled: true,
        resume_context_customized: customized,
        resume_context_overrides: customized
          ? {
              skills: uniqueNonEmpty(skills),
              locations: uniqueNonEmpty(locations),
              role_types: uniqueNonEmpty(roleTypes),
              note: note.trim(),
            }
          : {
              skills: [],
              locations: [],
              role_types: [],
              note: "",
            },
        is_active: active,
      };

      const response = await fetch("/api/discovery/preferences", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as DiscoveryPreferences | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data ? String(data.error) : "Save failed");
      }
      setPreferences(data as DiscoveryPreferences);
      setLiveMessage("Context saved.");
      toast.success("Context saved.");
      onOpenChange(false);
      await fetchPreferences();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed.";
      setLiveMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="pr-8">
          <SheetTitle>Edit search context</SheetTitle>
          <SheetDescription>
            We fill these fields from your latest resume when we can. Edit anything below and Discover will use exactly what you save.
          </SheetDescription>
        </SheetHeader>

        <div className="sr-only" role="status" aria-live="polite">
          {liveMessage}
        </div>

        <div className="space-y-8 py-6">
          <section className="space-y-5 rounded-2xl border border-border/70 bg-background/50 p-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Search context</p>
              <p className="text-sm text-foreground">
                {preview?.has_resume
                  ? "Your latest resume has already filled these boxes. Change anything you want, then save."
                  : "No resume was detected yet, so fill in the context you want Discover to use."}
              </p>
            </div>

            <EditableContextChipList
              label="Skills"
              items={skills}
              itemLabel="skill"
              placeholder="Add a skill like Python or FastAPI"
              helperText="These are the main search terms Discover will use."
              onChange={setSkills}
            />

            <EditableContextChipList
              label="Role level"
              items={roleTypes}
              itemLabel="role level"
              placeholder="Add a role level like intern or junior"
              onChange={setRoleTypes}
            />

            <EditableContextChipList
              label="Location"
              items={locations}
              itemLabel="location"
              placeholder="Add a location like Toronto or Remote"
              onChange={setLocations}
            />

            <div className="space-y-2">
              <Label htmlFor="context-note">Notes for search</Label>
              <p className="text-xs text-muted-foreground">
                Use this for anything the chips miss, like a domain, company type, or kind of work you want.
              </p>
              <Textarea
                id="context-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Example: backend AI infrastructure internships at product-focused companies"
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">What Discover will use</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{localSummary}</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Advanced filters</p>
                <p className="text-sm text-muted-foreground">
                  The main search context lives above. These only tighten the search around it.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced((value) => !value)}
                aria-expanded={showAdvanced}
                aria-controls="advanced-discovery-filters"
              >
                {showAdvanced ? "Hide advanced filters" : "Show advanced filters"}
              </Button>
            </div>

            {showAdvanced ? (
              <div id="advanced-discovery-filters" className="space-y-4 rounded-2xl border border-border/70 bg-background/50 p-4">
                <div className="space-y-1.5">
                  <Label>Remote preference</Label>
                  <Select value={remote} onValueChange={(value) => setRemote(value as RemotePreference)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="remote_only">Remote only</SelectItem>
                      <SelectItem value="hybrid">Hybrid friendly</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="disc-excluded">Excluded companies</Label>
                  <Input
                    id="disc-excluded"
                    value={excluded}
                    onChange={(event) => setExcluded(event.target.value)}
                    placeholder="Add a company to exclude"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="disc-slugs">Greenhouse company slugs</Label>
                  <Input
                    id="disc-slugs"
                    value={slugs}
                    onChange={(event) => setSlugs(event.target.value)}
                    placeholder="Add slugs like openai or anthropic"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="disc-min">Minimum match score ({minScore})</Label>
                  <Input
                    id="disc-min"
                    type="range"
                    min={0}
                    max={100}
                    value={minScore}
                    onChange={(event) => setMinScore(Number(event.target.value))}
                    className="py-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values are stricter. Start around 55 to 65 for a shortlist that still feels comfortable.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="disc-active"
                    type="checkbox"
                    className="h-4 w-4 rounded border border-border"
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                  />
                  <Label htmlFor="disc-active" className="font-normal">
                    Automated discovery enabled
                  </Label>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <SheetFooter className="gap-2 border-t border-border/70 pt-4">
          <Button type="button" variant="outline" onClick={resetToResume}>
            Reset to resume
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" disabled={saving} onClick={() => void onSave()}>
            Save context
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
