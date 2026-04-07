"use client";

import { useEffect, useState } from "react";
import { useDiscoverStore } from "@/stores/discover-store";
import { PreferencesBar } from "./preferences-bar";
import { PreferencesDialog } from "./preferences-dialog";
import { JobFeed } from "./job-feed";
import { DiscoveryStats } from "./discovery-stats";

export const DiscoverView = () => {
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [startInAdvanced, setStartInAdvanced] = useState(false);
  const fetchPreferences = useDiscoverStore((s) => s.fetchPreferences);
  const fetchOpportunities = useDiscoverStore((s) => s.fetchOpportunities);
  const opportunities = useDiscoverStore((s) => s.opportunities);

  useEffect(() => {
    void fetchPreferences();
    void fetchOpportunities();
  }, [fetchPreferences, fetchOpportunities]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Discover
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          AI-powered job discovery across Adzuna, Greenhouse, Himalayas, Jobicy, RemoteOK, JSearch,
          and The Muse. Start from your resume, then refine.
        </p>
      </div>

      <DiscoveryStats opportunities={opportunities} />

      <PreferencesBar
        onOpenPrefs={() => {
          setStartInAdvanced(false);
          setPrefsOpen(true);
        }}
        onOpenAdvanced={() => {
          setStartInAdvanced(true);
          setPrefsOpen(true);
        }}
      />
      <PreferencesDialog
        open={prefsOpen}
        onOpenChange={setPrefsOpen}
        startInAdvanced={startInAdvanced}
      />
      <JobFeed />
    </div>
  );
};
