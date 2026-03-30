"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { LocalProfileBuilderForm } from "@/components/profile/local-profile-builder-form";
import { LocalProfilePreview } from "@/components/profile/local-profile-preview";
import { GlassCard } from "@/components/ui/glass-card";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useProfileBuilderStore } from "@/stores/profile-builder-store";

export function ProfileSettingsSection() {
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const {
    basicInfo,
    skills,
    projects,
    experiences,
    updateBasicInfo,
    updateLinks,
    addSkill,
    removeSkill,
    addProject,
    updateProject,
    removeProject,
    addExperience,
    updateExperience,
    removeExperience,
  } = useProfileBuilderStore();

  const publicUrl = useMemo(() => {
    if (!basicInfo.username.trim()) return "";
    if (typeof window === "undefined") return `/profile/${basicInfo.username}`;
    return `${window.location.origin}/profile/${basicInfo.username}`;
  }, [basicInfo.username]);

  const copyPublicLink = async () => {
    if (!publicUrl) {
      toast.error("Set a username first to get your public link.");
      return;
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Public profile link copied.");
    } catch {
      toast.error("Could not copy profile link.");
    }
  };

  const totalItems = experiences.length + projects.length + skills.length;

  const handleExportPdf = async () => {
    if (!previewRef.current) {
      toast.error("Preview is not ready yet.");
      return;
    }
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: "#0b1020",
      });
      const image = canvas.toDataURL("image/png");
      const pdf = new JsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(image, "PNG", 0, 0, width, height);
      pdf.save(`interniq-profile-${basicInfo.username || "draft"}.pdf`);
      toast.success("Profile PDF exported.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export profile PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl md:text-3xl">Profile & portfolio</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Build your public portfolio and power all AI personalization.
          </p>
        </div>
        <div className="flex gap-2">
          <MagneticButton variant="outline" onClick={() => void copyPublicLink()} disabled={!publicUrl}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Share Link
          </MagneticButton>
          <MagneticButton variant="secondary" onClick={() => void handleExportPdf()} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export PDF"}
          </MagneticButton>
        </div>
      </div>

      <GlassCard className="p-4" tiltEnabled={false}>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border px-3 py-1 text-muted-foreground">
            Username: <span className="text-foreground">{basicInfo.username || "not set"}</span>
          </span>
          <span className="rounded-full border px-3 py-1 text-muted-foreground">
            Portfolio blocks: <span className="text-foreground">{totalItems}</span>
          </span>
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <LocalProfileBuilderForm
          basicInfo={basicInfo}
          updateBasicInfo={updateBasicInfo}
          updateLinks={updateLinks}
          skills={skills}
          addSkill={addSkill}
          removeSkill={removeSkill}
          projects={projects}
          addProject={addProject}
          updateProject={updateProject}
          removeProject={removeProject}
          experiences={experiences}
          addExperience={addExperience}
          updateExperience={updateExperience}
          removeExperience={removeExperience}
        />
        <div ref={previewRef} className="space-y-4">
          <LocalProfilePreview
            basicInfo={basicInfo}
            skills={skills}
            projects={projects}
            experiences={experiences}
          />
          {!basicInfo.fullName && !basicInfo.username && !skills.length && !projects.length && !experiences.length ? (
            <GlassCard className="p-4" tiltEnabled={false}>
              <p className="text-sm text-muted-foreground">
                Start filling the form to build your preview instantly.
              </p>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
