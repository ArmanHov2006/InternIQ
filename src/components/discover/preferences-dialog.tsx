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
import { ContextChipList, EditableContextChipList } from "./context-chip-editor";

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

export const PreferencesDialog = ({
  open,
  onOpenChange,
  startInAdvanced = false,
}: PreferencesDialogProps) => {
  const preferences = useDiscoverStore((state) => state.preferences);
  const setPreferences = useDiscoverStore((state) => state.setPreferences);
  const fetchPreferences = useDiscoverStore((state) => state.fetchPreferences);

  const [resumeContextEnabled, setResumeContextEnabled] = useState(true);
  const [resumeContextCustomized, setResumeContextCustomized] = useState(false);
  const [skillOverrides, setSkillOverrides] = useState<string[]>([]);
  const [locationOverrides, setLocationOverrides] = useState<string[]>([]);
  const [roleTypeOverrides, setRoleTypeOverrides] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const [keywords, setKeywords] = useState("");
  const [locations, setLocations] = useState("");
  const [remote, setRemote] = useState<RemotePreference>("any");
  const [roleTypes, setRoleTypes] = useState("");
  const [excluded, setExcluded] = useState("");
  const [slugs, setSlugs] = useState("");
  const [minScore, setMinScore] = useState(55);
  const [active, setActive] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  const preview = preferences?.resume_context_preview;
  const detectedSkills = useMemo(
    () => preview?.detected_skills ?? [],
    [preview?.detected_skills]
  );
  const detectedLocations = useMemo(
    () => preview?.detected_locations ?? [],
    [preview?.detected_locations]
  );
  const detectedRoleTypes = useMemo(
    () => preview?.detected_role_types ?? [],
    [preview?.detected_role_types]
  );

  useEffect(() => {
    if (!preferences || !open) return;
    setResumeContextEnabled(preferences.resume_context_enabled);
    setResumeContextCustomized(preferences.resume_context_customized);
    setSkillOverrides(preferences.resume_context_overrides.skills);
    setLocationOverrides(preferences.resume_context_overrides.locations);
    setRoleTypeOverrides(preferences.resume_context_overrides.role_types);
    setNote(preferences.resume_context_overrides.note);

    setKeywords(preferences.keywords.join(", "));
    setLocations(preferences.locations.join(", "));
    setRemote(preferences.remote_preference);
    setRoleTypes(preferences.role_types.join(", "));
    setExcluded(preferences.excluded_companies.join(", "));
    setSlugs(preferences.greenhouse_slugs.join(", "));
    setMinScore(preferences.min_match_score);
    setActive(preferences.is_active);
    setShowAdvanced(startInAdvanced);
  }, [preferences, open, startInAdvanced]);

  const hasManualContext = useMemo(
    () =>
      skillOverrides.length > 0 ||
      locationOverrides.length > 0 ||
      roleTypeOverrides.length > 0 ||
      note.trim().length > 0,
    [locationOverrides.length, note, roleTypeOverrides.length, skillOverrides.length]
  );

  const customized = resumeContextEnabled ? resumeContextCustomized : hasManualContext;

  const effectiveSkills = useMemo(() => {
    if (!resumeContextEnabled) return skillOverrides;
    return customized ? skillOverrides : detectedSkills;
  }, [customized, detectedSkills, resumeContextEnabled, skillOverrides]);

  const effectiveLocations = useMemo(() => {
    if (!resumeContextEnabled) return locationOverrides;
    return customized ? locationOverrides : detectedLocations;
  }, [customized, detectedLocations, locationOverrides, resumeContextEnabled]);

  const effectiveRoleTypes = useMemo(() => {
    if (!resumeContextEnabled) return roleTypeOverrides;
    return customized ? roleTypeOverrides : detectedRoleTypes;
  }, [customized, detectedRoleTypes, resumeContextEnabled, roleTypeOverrides]);

  const resetToResume = () => {
    setResumeContextEnabled(true);
    setResumeContextCustomized(false);
    setSkillOverrides([]);
    setLocationOverrides([]);
    setRoleTypeOverrides([]);
    setNote("");
    setLiveMessage("Context reset to your latest resume.");
  };

  const localSummary = useMemo(() => {
    const skillsText = effectiveSkills.length > 0 ? effectiveSkills.slice(0, 3).join(", ") : "broad discovery terms";
    const locationText = effectiveLocations.length > 0 ? ` around ${effectiveLocations.slice(0, 2).join(", ")}` : "";
    const roleText = effectiveRoleTypes.length > 0 ? ` for ${effectiveRoleTypes.join(", ")} roles` : "";
    const noteText = note.trim() ? " Custom notes will also guide the search." : "";

    if (!preview?.has_resume && !resumeContextEnabled) {
      return `Resume context is off. Discover will use your saved context for ${skillsText}${locationText}${roleText}.${noteText}`;
    }
    if (!preview?.has_resume) {
      return `No resume detected yet. Discover will use your saved context for ${skillsText}${locationText}${roleText}.${noteText}`;
    }
    if (!resumeContextEnabled) {
      return `Resume context is off. Discover will use your saved context for ${skillsText}${locationText}${roleText}.${noteText}`;
    }
    return `Using your latest resume to look for ${skillsText}${locationText}${roleText}.${noteText}`;
  }, [effectiveLocations, effectiveRoleTypes, effectiveSkills, note, preview?.has_resume, resumeContextEnabled]);

  const onSave = async () => {
    setSaving(true);
    try {
      const body = {
        keywords: parseList(keywords),
        locations: parseList(locations),
        remote_preference: remote,
        role_types: parseList(roleTypes),
        excluded_companies: parseList(excluded),
        greenhouse_slugs: parseList(slugs).map((value) => value.toLowerCase().replace(/\s+/g, "-")),
        min_match_score: minScore,
        resume_context_enabled: resumeContextEnabled,
        resume_context_customized: customized,
        resume_context_overrides: {
          skills: customized ? uniqueNonEmpty(skillOverrides) : [],
          locations: customized ? uniqueNonEmpty(locationOverrides) : [],
          role_types: customized ? uniqueNonEmpty(roleTypeOverrides) : [],
          note: customized ? note.trim() : "",
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

  const renderMeta = (values: string[], detected: string[]) => (item: string) => {
    if (detected.includes(item)) return "Detected";
    if (!resumeContextEnabled) return "Manual";
    return values.includes(item) ? "Saved" : null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="pr-8">
          <SheetTitle>Search context</SheetTitle>
          <SheetDescription>
            Discover starts with your resume by default. You can edit the saved context below, then keep advanced filters tucked away until you need them.
          </SheetDescription>
        </SheetHeader>

        <div className="sr-only" role="status" aria-live="polite">
          {liveMessage}
        </div>

        <div className="space-y-8 py-6">
          <section className="space-y-4 rounded-2xl border border-border/70 bg-background/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Resume context</p>
                <p className="text-sm text-foreground">
                  {preview?.has_resume
                    ? "Discover can keep using the strongest signals from your latest resume."
                    : "No resume was detected yet, so this section falls back to whatever you save manually."}
                </p>
              </div>
              <label className="flex items-center gap-3 rounded-full border border-border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-border"
                  checked={resumeContextEnabled}
                  onChange={(event) => {
                    if (!event.target.checked && !hasManualContext) {
                      setSkillOverrides(effectiveSkills);
                      setLocationOverrides(effectiveLocations);
                      setRoleTypeOverrides(effectiveRoleTypes);
                    }
                    setResumeContextEnabled(event.target.checked);
                    setLiveMessage(
                      event.target.checked
                        ? "Resume context turned on."
                        : "Resume context turned off."
                    );
                  }}
                />
                <span>Use resume context</span>
              </label>
            </div>

            <ContextChipList
              label="Detected from resume"
              items={detectedSkills}
              emptyLabel="Add a resume or more profile detail to unlock detected skills."
              getItemMeta={() => "Detected"}
            />
            <ContextChipList
              label="Detected role level"
              items={detectedRoleTypes}
              emptyLabel="No role level detected yet."
              getItemMeta={() => "Detected"}
            />
            <ContextChipList
              label="Detected location"
              items={detectedLocations}
              emptyLabel="No location detected yet."
              getItemMeta={() => "Detected"}
            />
          </section>

          <section className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Edit your context</p>
              <p className="text-sm text-muted-foreground">
                These saved choices shape future discovery runs. Remove chips you do not want, add the ones you do, and keep the note short and specific.
              </p>
            </div>

            <EditableContextChipList
              label="Skills"
              items={skillOverrides}
              itemLabel="skill"
              placeholder="Add a skill like Python or FastAPI"
              helperText="Tab to a chip and press Delete or Enter to remove it."
              onChange={(values) => {
                setSkillOverrides(values);
                setResumeContextCustomized(true);
              }}
              getItemMeta={renderMeta(skillOverrides, detectedSkills)}
            />

            <EditableContextChipList
              label="Role level"
              items={roleTypeOverrides}
              itemLabel="role level"
              placeholder="Add a role level like intern or junior"
              onChange={(values) => {
                setRoleTypeOverrides(values);
                setResumeContextCustomized(true);
              }}
              getItemMeta={renderMeta(roleTypeOverrides, detectedRoleTypes)}
            />

            <EditableContextChipList
              label="Location"
              items={locationOverrides}
              itemLabel="location"
              placeholder="Add a location like Toronto or Remote"
              onChange={(values) => {
                setLocationOverrides(values);
                setResumeContextCustomized(true);
              }}
              getItemMeta={renderMeta(locationOverrides, detectedLocations)}
            />

            <div className="space-y-2">
              <Label htmlFor="context-note">Notes for search</Label>
              <p className="text-xs text-muted-foreground">
                Keep this short. It should capture anything important the chips miss, like preferred work or domain.
              </p>
              <Textarea
                id="context-note"
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setResumeContextCustomized(true);
                }}
                placeholder="Example: backend AI infrastructure internships at product-focused companies"
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Saved preview</p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                {localSummary}
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <ContextChipList
                  label="Skills"
                  items={effectiveSkills}
                  emptyLabel="No saved skills."
                  getItemMeta={(item) =>
                    detectedSkills.includes(item) ? "Detected" : resumeContextEnabled ? "Saved" : "Manual"
                  }
                />
                <ContextChipList
                  label="Role level"
                  items={effectiveRoleTypes}
                  emptyLabel="No saved role levels."
                  getItemMeta={(item) =>
                    detectedRoleTypes.includes(item) ? "Detected" : resumeContextEnabled ? "Saved" : "Manual"
                  }
                />
                <ContextChipList
                  label="Location"
                  items={effectiveLocations}
                  emptyLabel="No saved locations."
                  getItemMeta={(item) =>
                    detectedLocations.includes(item) ? "Detected" : resumeContextEnabled ? "Saved" : "Manual"
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Advanced filters</p>
                <p className="text-sm text-muted-foreground">
                  These stay secondary to the resume flow, but you can still narrow the search when needed.
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
                  <Label htmlFor="disc-keywords">Extra keywords</Label>
                  <Input
                    id="disc-keywords"
                    value={keywords}
                    onChange={(event) => setKeywords(event.target.value)}
                    placeholder="Add extra terms like fintech or platform"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="disc-locations">Extra locations</Label>
                  <Input
                    id="disc-locations"
                    value={locations}
                    onChange={(event) => setLocations(event.target.value)}
                    placeholder="Add places like Vancouver or New York"
                  />
                </div>
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
                  <Label htmlFor="disc-roles">Extra role types</Label>
                  <Input
                    id="disc-roles"
                    value={roleTypes}
                    onChange={(event) => setRoleTypes(event.target.value)}
                    placeholder="Add role types like co-op or new grad"
                  />
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
