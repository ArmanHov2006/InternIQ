"use client";

import { useEffect, useState } from "react";
import { useDiscoverStore } from "@/stores/discover-store";
import { PreferencesBar } from "./preferences-bar";
import { PreferencesDialog } from "./preferences-dialog";
import { JobFeed } from "./job-feed";

export const DiscoverView = () => {
  const [prefsOpen, setPrefsOpen] = useState(false);
  const fetchPreferences = useDiscoverStore((s) => s.fetchPreferences);
  const fetchOpportunities = useDiscoverStore((s) => s.fetchOpportunities);

  useEffect(() => {
    void fetchPreferences();
    void fetchOpportunities();
  }, [fetchPreferences, fetchOpportunities]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Discover</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pull roles from Adzuna, Remotive, Greenhouse, and The Muse — ranked against your profile.
        </p>
      </div>

      <PreferencesBar onOpenPrefs={() => setPrefsOpen(true)} />
      <PreferencesDialog open={prefsOpen} onOpenChange={setPrefsOpen} />
      <JobFeed />
    </div>
  );
};
