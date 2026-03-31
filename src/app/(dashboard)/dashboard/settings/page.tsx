"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GmailAutomationSection } from "@/components/settings/gmail-automation-section";
import { ProfileSettingsSection } from "@/components/settings/profile-settings-section";
import { ResumesSection } from "@/components/settings/resumes-section";
import { getGmailOauthToast, getSettingsSectionFromSearch } from "@/lib/navigation/dashboard-routes";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const oauthToastDone = useRef(false);

  useEffect(() => {
    const section = getSettingsSectionFromSearch(new URLSearchParams(searchParams.toString()));
    const id = section === "integrations" ? "integrations" : section === "profile" ? "profile" : null;
    if (!id) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchParams]);

  useEffect(() => {
    if (oauthToastDone.current) return;
    const nextToast = getGmailOauthToast(new URLSearchParams(searchParams.toString()));
    if (!nextToast) return;
    oauthToastDone.current = true;
    if (nextToast.type === "success") toast.success(nextToast.message);
    else toast.error(nextToast.message);
  }, [searchParams]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile, resumes, and integrations</p>
      </div>

      <section id="profile" className="scroll-mt-24 space-y-8">
        <h2 className="text-lg font-semibold">Profile</h2>
        <ProfileSettingsSection />
        <ResumesSection />
      </section>

      <section id="integrations" className="scroll-mt-24 space-y-4">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <GmailAutomationSection />
      </section>
    </div>
  );
}
