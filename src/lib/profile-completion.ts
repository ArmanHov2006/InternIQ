import type { Education, Experience, Profile, Project, Resume, Skill } from "@/types/database";

interface ProfileData {
  profile: Profile | null;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
  resumes: Resume[];
}

interface CompletionItem {
  label: string;
  completed: boolean;
  href: string;
}

export function getProfileCompletion(data: ProfileData): {
  percentage: number;
  items: CompletionItem[];
} {
  const items: CompletionItem[] = [
    { label: "Add your name", completed: Boolean(data.profile?.full_name), href: "/dashboard/profile" },
    { label: "Upload avatar", completed: Boolean(data.profile?.avatar_url), href: "/dashboard/profile" },
    { label: "Write a bio", completed: Boolean(data.profile?.bio), href: "/dashboard/profile" },
    { label: "Set your username", completed: Boolean(data.profile?.username), href: "/dashboard/profile" },
    { label: "Add education", completed: data.education.length > 0, href: "/dashboard/profile" },
    { label: "Add experience", completed: data.experience.length > 0, href: "/dashboard/profile" },
    { label: "Add a project", completed: data.projects.length > 0, href: "/dashboard/profile" },
    { label: "Add skills", completed: data.skills.length > 0, href: "/dashboard/profile" },
    { label: "Upload resume", completed: data.resumes.length > 0, href: "/dashboard/profile" },
    { label: "Set LinkedIn URL", completed: Boolean(data.profile?.linkedin_url), href: "/dashboard/profile" },
  ];

  const completed = items.filter((item) => item.completed).length;
  return {
    percentage: Math.round((completed / items.length) * 100),
    items,
  };
}
