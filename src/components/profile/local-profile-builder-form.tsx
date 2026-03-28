"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ProfileExperience, ProfileProject, ProfileSkillCategory } from "@/types/local-features";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MagneticButton } from "@/components/ui/magnetic-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type LocalProfileBuilderFormProps = {
  basicInfo: {
    fullName: string;
    username: string;
    university: string;
    graduationYear: string;
    location: string;
    headline: string;
    bio: string;
    links: { website: string; github: string; linkedin: string; portfolio: string };
  };
  updateBasicInfo: (payload: Partial<LocalProfileBuilderFormProps["basicInfo"]>) => void;
  updateLinks: (payload: Partial<LocalProfileBuilderFormProps["basicInfo"]["links"]>) => void;
  skills: { id: string; name: string; category: ProfileSkillCategory }[];
  addSkill: (name: string, category: ProfileSkillCategory) => void;
  removeSkill: (id: string) => void;
  projects: ProfileProject[];
  addProject: (project: Omit<ProfileProject, "id">) => void;
  updateProject: (id: string, payload: Omit<ProfileProject, "id">) => void;
  removeProject: (id: string) => void;
  experiences: ProfileExperience[];
  addExperience: (experience: Omit<ProfileExperience, "id">) => void;
  updateExperience: (id: string, payload: Omit<ProfileExperience, "id">) => void;
  removeExperience: (id: string) => void;
};

export function LocalProfileBuilderForm({
  basicInfo,
  updateBasicInfo,
  updateLinks,
  skills,
  addSkill,
  removeSkill,
  projects,
  addProject,
  updateProject,
  removeProject,
  experiences,
  addExperience,
  updateExperience,
  removeExperience,
}: LocalProfileBuilderFormProps) {
  const [skillName, setSkillName] = useState("");
  const [skillCategory, setSkillCategory] = useState<ProfileSkillCategory>("language");
  const [projectDraft, setProjectDraft] = useState({ title: "", description: "", techStack: "", link: "" });
  const [experienceDraft, setExperienceDraft] = useState({
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    bullets: "",
  });

  return (
    <div className="space-y-4">
      <GlassCard className="p-5" tiltEnabled={false}>
        <h2 className="mb-4 text-lg font-semibold">Basic Info</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-full-name">Full Name</Label>
            <Input
              id="profile-full-name"
              value={basicInfo.fullName}
              onChange={(event) => updateBasicInfo({ fullName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-username">Username</Label>
            <Input
              id="profile-username"
              value={basicInfo.username}
              onChange={(event) => updateBasicInfo({ username: event.target.value.toLowerCase().replace(/\s+/g, "-") })}
              placeholder="your-handle"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-graduation-year">Graduation Year</Label>
            <Input
              id="profile-graduation-year"
              value={basicInfo.graduationYear}
              onChange={(event) => updateBasicInfo({ graduationYear: event.target.value })}
              placeholder="2027"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-university">University</Label>
            <Input
              id="profile-university"
              value={basicInfo.university}
              onChange={(event) => updateBasicInfo({ university: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-location">Location</Label>
            <Input
              id="profile-location"
              value={basicInfo.location}
              onChange={(event) => updateBasicInfo({ location: event.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-headline">Headline</Label>
            <Input
              id="profile-headline"
              value={basicInfo.headline}
              onChange={(event) => updateBasicInfo({ headline: event.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              rows={4}
              value={basicInfo.bio}
              onChange={(event) => updateBasicInfo({ bio: event.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-linkedin">LinkedIn</Label>
            <Input
              id="profile-linkedin"
              value={basicInfo.links.linkedin}
              onChange={(event) => updateLinks({ linkedin: event.target.value })}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-github">GitHub</Label>
            <Input
              id="profile-github"
              value={basicInfo.links.github}
              onChange={(event) => updateLinks({ github: event.target.value })}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-website">Website</Label>
            <Input
              id="profile-website"
              value={basicInfo.links.website}
              onChange={(event) => updateLinks({ website: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-portfolio">Portfolio</Label>
            <Input
              id="profile-portfolio"
              value={basicInfo.links.portfolio}
              onChange={(event) => updateLinks({ portfolio: event.target.value })}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5" tiltEnabled={false}>
        <h2 className="mb-4 text-lg font-semibold">Skills</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
          <Input
            value={skillName}
            onChange={(event) => setSkillName(event.target.value)}
            placeholder="TypeScript"
          />
          <Select value={skillCategory} onValueChange={(value) => setSkillCategory(value as ProfileSkillCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="language">Language</SelectItem>
              <SelectItem value="framework">Framework</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
            </SelectContent>
          </Select>
          <MagneticButton
            onClick={() => {
              const trimmed = skillName.trim();
              if (!trimmed) return;
              addSkill(trimmed, skillCategory);
              setSkillName("");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </MagneticButton>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill.id} variant="secondary" className="gap-2">
              <span>{skill.name}</span>
              <button type="button" onClick={() => removeSkill(skill.id)} aria-label={`Remove ${skill.name}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
          {!skills.length ? <p className="text-sm text-muted-foreground">No skills added yet.</p> : null}
        </div>
      </GlassCard>

      <GlassCard className="p-5" tiltEnabled={false}>
        <h2 className="mb-4 text-lg font-semibold">Projects</h2>
        <div className="grid gap-3">
          <Input
            value={projectDraft.title}
            onChange={(event) => setProjectDraft((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Project title"
          />
          <Textarea
            rows={3}
            value={projectDraft.description}
            onChange={(event) => setProjectDraft((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Project description"
          />
          <Input
            value={projectDraft.techStack}
            onChange={(event) => setProjectDraft((prev) => ({ ...prev, techStack: event.target.value }))}
            placeholder="Tech stack tags (comma separated)"
          />
          <Input
            value={projectDraft.link}
            onChange={(event) => setProjectDraft((prev) => ({ ...prev, link: event.target.value }))}
            placeholder="Project link"
          />
          <MagneticButton
            onClick={() => {
              if (!projectDraft.title.trim()) return;
              addProject({
                title: projectDraft.title.trim(),
                description: projectDraft.description.trim(),
                techStack: projectDraft.techStack
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
                link: projectDraft.link.trim(),
              });
              setProjectDraft({ title: "", description: "", techStack: "", link: "" });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </MagneticButton>
        </div>

        <div className="mt-4 space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="grid gap-2">
                <Input
                  value={project.title}
                  onChange={(event) =>
                    updateProject(project.id, { ...project, title: event.target.value })
                  }
                />
                <Textarea
                  rows={2}
                  value={project.description}
                  onChange={(event) =>
                    updateProject(project.id, { ...project, description: event.target.value })
                  }
                />
                <Input
                  value={project.techStack.join(", ")}
                  onChange={(event) =>
                    updateProject(project.id, {
                      ...project,
                      techStack: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <Input
                  value={project.link}
                  onChange={(event) =>
                    updateProject(project.id, { ...project, link: event.target.value })
                  }
                />
                <MagneticButton variant="outline" onClick={() => removeProject(project.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Project
                </MagneticButton>
              </div>
            </div>
          ))}
          {!projects.length ? <p className="text-sm text-muted-foreground">No projects added yet.</p> : null}
        </div>
      </GlassCard>

      <GlassCard className="p-5" tiltEnabled={false}>
        <h2 className="mb-4 text-lg font-semibold">Experience</h2>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={experienceDraft.company}
              onChange={(event) => setExperienceDraft((prev) => ({ ...prev, company: event.target.value }))}
              placeholder="Company"
            />
            <Input
              value={experienceDraft.role}
              onChange={(event) => setExperienceDraft((prev) => ({ ...prev, role: event.target.value }))}
              placeholder="Role"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={experienceDraft.startDate}
              onChange={(event) => setExperienceDraft((prev) => ({ ...prev, startDate: event.target.value }))}
              placeholder="Start date"
            />
            <Input
              value={experienceDraft.endDate}
              onChange={(event) => setExperienceDraft((prev) => ({ ...prev, endDate: event.target.value }))}
              placeholder="End date or Present"
            />
          </div>
          <Textarea
            rows={3}
            value={experienceDraft.bullets}
            onChange={(event) => setExperienceDraft((prev) => ({ ...prev, bullets: event.target.value }))}
            placeholder="Bullets (one per line)"
          />
          <MagneticButton
            onClick={() => {
              if (!experienceDraft.company.trim() || !experienceDraft.role.trim()) return;
              addExperience({
                company: experienceDraft.company.trim(),
                role: experienceDraft.role.trim(),
                startDate: experienceDraft.startDate.trim(),
                endDate: experienceDraft.endDate.trim(),
                bullets: experienceDraft.bullets
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              });
              setExperienceDraft({ company: "", role: "", startDate: "", endDate: "", bullets: "" });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Experience
          </MagneticButton>
        </div>

        <div className="mt-4 space-y-3">
          {experiences.map((experience) => (
            <div key={experience.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="grid gap-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={experience.company}
                    onChange={(event) =>
                      updateExperience(experience.id, { ...experience, company: event.target.value })
                    }
                  />
                  <Input
                    value={experience.role}
                    onChange={(event) =>
                      updateExperience(experience.id, { ...experience, role: event.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={experience.startDate}
                    onChange={(event) =>
                      updateExperience(experience.id, { ...experience, startDate: event.target.value })
                    }
                  />
                  <Input
                    value={experience.endDate}
                    onChange={(event) =>
                      updateExperience(experience.id, { ...experience, endDate: event.target.value })
                    }
                  />
                </div>
                <Textarea
                  rows={3}
                  value={experience.bullets.join("\n")}
                  onChange={(event) =>
                    updateExperience(experience.id, {
                      ...experience,
                      bullets: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <MagneticButton variant="outline" onClick={() => removeExperience(experience.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Experience
                </MagneticButton>
              </div>
            </div>
          ))}
          {!experiences.length ? <p className="text-sm text-muted-foreground">No experience entries yet.</p> : null}
        </div>
      </GlassCard>
    </div>
  );
}
