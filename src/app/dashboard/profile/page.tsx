"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Building2, Code2, GraduationCap, Link2, User, Wrench, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { EducationForm } from "@/components/profile/education-form";
import { ExperienceForm } from "@/components/profile/experience-form";
import { ProjectForm } from "@/components/profile/project-form";
import { SkillsForm } from "@/components/profile/skills-form";
import { ResumeManager } from "@/components/profile/resume-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import type {
  Education,
  Experience,
  Profile,
  Project,
  Skill,
} from "@/types/database";

type ProfilePayload = {
  profile: Profile | null;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
};

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const data: unknown = await res.json();
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/profile", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const data = await parseJsonResponse<ProfilePayload>(res);
      setProfile(data.profile);
      setEducation(data.education);
      setExperience(data.experience);
      setProjects(data.projects);
      setSkills(data.skills);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load profile";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleCopyProfileLink = async () => {
    const username = profile?.username?.trim();
    if (!username) {
      toast.error("Set a username to copy your public profile link.");
      return;
    }
    const text = `https://interniq.vercel.app/${encodeURIComponent(username)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Profile link copied to clipboard.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{fetchError}</p>
        <Button type="button" variant="outline" onClick={() => void loadProfile()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Edit how you appear on your public InternIQ profile.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 gap-2"
            onClick={() => void handleCopyProfileLink()}
            disabled={!profile?.username?.trim()}
          >
            <Link2 className="h-4 w-4" />
            Copy Profile Link
          </Button>
        </div>

        <motion.div
          className="space-y-8"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        >
        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
        <SpotlightCard>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Basics</CardTitle>
              <CardDescription>Name, headline, links, and visibility for recruiters.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} onProfileChange={setProfile} />
          </CardContent>
        </Card>
        </SpotlightCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
        <SpotlightCard>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <GraduationCap className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>Education</CardTitle>
              <CardDescription>Add your schools and degrees</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <EducationForm education={education} onEducationChange={setEducation} />
          </CardContent>
        </Card>
        </SpotlightCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
        <SpotlightCard>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Building2 className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle>Experience</CardTitle>
              <CardDescription>Jobs and internships.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ExperienceForm experience={experience} onExperienceChange={setExperience} />
          </CardContent>
        </Card>
        </SpotlightCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
        <SpotlightCard>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <Code2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Things you have built.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ProjectForm projects={projects} onProjectsChange={setProjects} />
          </CardContent>
        </Card>
        </SpotlightCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
        <SpotlightCard>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <Wrench className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Group skills by category for clarity.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <SkillsForm skills={skills} onSkillsChange={setSkills} />
          </CardContent>
        </Card>
        </SpotlightCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
        <SpotlightCard>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-lg bg-rose-500/10 p-2">
              <FileText className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <CardTitle>Your Resumes</CardTitle>
              <CardDescription>Manage resumes used by AI analysis and email generation.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ResumeManager />
          </CardContent>
        </Card>
        </SpotlightCard>
        </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
