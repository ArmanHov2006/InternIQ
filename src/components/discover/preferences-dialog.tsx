"use client";

import { useEffect, useState } from "react";
import type { DiscoveryPreferences, RemotePreference } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useDiscoverStore } from "@/stores/discover-store";
import { toast } from "sonner";

interface PreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const parseList = (raw: string): string[] =>
  raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export const PreferencesDialog = ({ open, onOpenChange }: PreferencesDialogProps) => {
  const preferences = useDiscoverStore((s) => s.preferences);
  const setPreferences = useDiscoverStore((s) => s.setPreferences);
  const fetchPreferences = useDiscoverStore((s) => s.fetchPreferences);

  const [keywords, setKeywords] = useState("");
  const [locations, setLocations] = useState("");
  const [remote, setRemote] = useState<RemotePreference>("any");
  const [roleTypes, setRoleTypes] = useState("");
  const [excluded, setExcluded] = useState("");
  const [slugs, setSlugs] = useState("");
  const [minScore, setMinScore] = useState(50);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!preferences || !open) return;
    setKeywords(preferences.keywords.join(", "));
    setLocations(preferences.locations.join(", "));
    setRemote(preferences.remote_preference);
    setRoleTypes(preferences.role_types.join(", "));
    setExcluded(preferences.excluded_companies.join(", "));
    setSlugs(preferences.greenhouse_slugs.join(", "));
    setMinScore(preferences.min_match_score);
    setActive(preferences.is_active);
  }, [preferences, open]);

  const onSave = async () => {
    setSaving(true);
    try {
      const body = {
        keywords: parseList(keywords),
        locations: parseList(locations),
        remote_preference: remote,
        role_types: parseList(roleTypes),
        excluded_companies: parseList(excluded),
        greenhouse_slugs: parseList(slugs).map((s) => s.toLowerCase().replace(/\s+/g, "-")),
        min_match_score: minScore,
        is_active: active,
      };
      const res = await fetch("/api/discovery/preferences", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as DiscoveryPreferences | { error?: string };
      if (!res.ok) {
        throw new Error("error" in data ? String(data.error) : "Save failed");
      }
      setPreferences(data as DiscoveryPreferences);
      toast.success("Preferences saved.");
      onOpenChange(false);
      await fetchPreferences();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Discovery preferences</DialogTitle>
          <DialogDescription>
            Keywords and locations are comma-separated. Greenhouse slugs are short names from the board URL (e.g.
            anthropic, openai).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="disc-keywords">Keywords</Label>
            <Input
              id="disc-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="react, typescript, intern"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="disc-locations">Locations</Label>
            <Input
              id="disc-locations"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="Remote, San Francisco"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Remote preference</Label>
            <Select value={remote} onValueChange={(v) => setRemote(v as RemotePreference)}>
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
            <Label htmlFor="disc-roles">Role types</Label>
            <Input
              id="disc-roles"
              value={roleTypes}
              onChange={(e) => setRoleTypes(e.target.value)}
              placeholder="intern, entry-level, junior"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="disc-excluded">Excluded companies</Label>
            <Input
              id="disc-excluded"
              value={excluded}
              onChange={(e) => setExcluded(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="disc-slugs">Greenhouse company slugs</Label>
            <Input
              id="disc-slugs"
              value={slugs}
              onChange={(e) => setSlugs(e.target.value)}
              placeholder="anthropic, vercel"
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
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="py-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="disc-active"
              type="checkbox"
              className="h-4 w-4 rounded border border-border"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <Label htmlFor="disc-active" className="font-normal">
              Automated discovery enabled (cron)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void onSave()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
