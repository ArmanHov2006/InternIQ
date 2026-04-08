"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { User, FileText, Plug } from "lucide-react";
import { GmailAutomationSection } from "@/components/settings/gmail-automation-section";
import { ProfileSettingsSection } from "@/components/settings/profile-settings-section";
import { ResumesSection } from "@/components/settings/resumes-section";
import { getGmailOauthToast, getSettingsSectionFromSearch } from "@/lib/navigation/dashboard-routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "resumes", label: "Resumes", icon: FileText },
  { id: "integrations", label: "Integrations", icon: Plug },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]["id"];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const oauthToastDone = useRef(false);
  const [activeSection, setActiveSection] = useState<SectionId>("profile");

  useEffect(() => {
    const section = getSettingsSectionFromSearch(new URLSearchParams(searchParams.toString()));
    if (section === "integrations") setActiveSection("integrations");
    else if (section === "profile") setActiveSection("profile");
  }, [searchParams]);

  useEffect(() => {
    if (oauthToastDone.current) return;
    const nextToast = getGmailOauthToast(new URLSearchParams(searchParams.toString()));
    if (!nextToast) return;
    oauthToastDone.current = true;
    if (nextToast.type === "success") toast.success(nextToast.message);
    else toast.error(nextToast.message);
  }, [searchParams]);

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile, resumes, and integrations</p>
      </div>

      {/* Mobile pill navigation */}
      <nav className="flex gap-2 overflow-x-auto md:hidden" aria-label="Settings sections">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              activeSection === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        {/* Side navigation */}
        <nav className="hidden md:block" aria-label="Settings sections">
          <div className="sticky top-24 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-100",
                  activeSection === item.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0 space-y-12">
          <section id="profile" className="scroll-mt-24 space-y-8">
            <h2 className="text-lg font-semibold">Profile</h2>
            <ProfileSettingsSection />
          </section>

          <section id="resumes" className="scroll-mt-24 space-y-8">
            <h2 className="text-lg font-semibold">Resumes</h2>
            <ResumesSection />
          </section>

          <section id="integrations" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold">Integrations</h2>
            <GmailAutomationSection />
          </section>
        </div>
      </div>
    </div>
  );
}
