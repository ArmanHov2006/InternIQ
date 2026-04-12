"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PublicProfile } from "@/components/profile/public-profile";
import type { PublicProfileProps } from "@/components/profile/public-profile";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { UserRound } from "lucide-react";

type FetchState =
  | { status: "loading" }
  | { status: "found"; data: PublicProfileProps }
  | { status: "not_found" }
  | { status: "error"; message: string };

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = (params?.username ?? "").toLowerCase();
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    if (!username) {
      setState({ status: "not_found" });
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
        if (cancelled) return;

        if (!res.ok) {
          setState({ status: "error", message: `Failed to load profile (${res.status})` });
          return;
        }

        const data = (await res.json()) as {
          profile: PublicProfileProps["profile"] | null;
          education: PublicProfileProps["education"];
          experience: PublicProfileProps["experience"];
          projects: PublicProfileProps["projects"];
          skills: PublicProfileProps["skills"];
        };

        if (!data.profile) {
          setState({ status: "not_found" });
          return;
        }

        setState({
          status: "found",
          data: {
            profile: data.profile,
            education: data.education ?? [],
            experience: data.experience ?? [],
            projects: data.projects ?? [],
            skills: data.skills ?? [],
          },
        });
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Failed to load profile." });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [username]);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        <SkeletonShimmer className="h-48 rounded-lg" />
        <SkeletonShimmer className="h-32 rounded-lg" />
        <SkeletonShimmer className="h-32 rounded-lg" />
      </div>
    );
  }

  if (state.status === "not_found") {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <EmptyState
          icon={<UserRound className="h-5 w-5" />}
          title="Profile not found"
          description="This user hasn't published their profile yet."
        />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <EmptyState
          icon={<UserRound className="h-5 w-5" />}
          title="Something went wrong"
          description={state.message}
        />
      </div>
    );
  }

  return <PublicProfile {...state.data} />;
}
