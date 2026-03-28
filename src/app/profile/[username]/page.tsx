"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { LocalProfilePreview } from "@/components/profile/local-profile-preview";
import { EmptyState } from "@/components/ui/empty-state";
import { UserRound } from "lucide-react";
import { useProfileBuilderStore } from "@/stores/profile-builder-store";

export default function LocalPublicProfilePage() {
  const params = useParams<{ username: string }>();
  const requestedUsername = (params?.username ?? "").toLowerCase();
  const { basicInfo, skills, projects, experiences } = useProfileBuilderStore();
  const profileUsername = basicInfo.username.trim().toLowerCase();

  const canRender = useMemo(() => {
    if (!profileUsername || !requestedUsername) return false;
    return profileUsername === requestedUsername;
  }, [profileUsername, requestedUsername]);

  if (!canRender) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <EmptyState
          icon={<UserRound className="h-5 w-5" />}
          title="Profile not found in local storage"
          description="This placeholder route only renders profiles saved in your current browser."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <LocalProfilePreview
        basicInfo={basicInfo}
        skills={skills}
        projects={projects}
        experiences={experiences}
      />
    </div>
  );
}
