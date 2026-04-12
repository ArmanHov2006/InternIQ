"use client";

import { ExternalLink, Github, GraduationCap, Linkedin, MapPin } from "lucide-react";
import type { ProfileBasicInfo, ProfileExperience, ProfileProject, ProfileSkill } from "@/types/local-features";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type LocalProfilePreviewProps = {
  basicInfo: ProfileBasicInfo;
  skills: ProfileSkill[];
  projects: ProfileProject[];
  experiences: ProfileExperience[];
};

export function LocalProfilePreview({
  basicInfo,
  skills,
  projects,
  experiences,
}: LocalProfilePreviewProps) {
  const skillGroups = ["language", "framework", "tool"].map((category) => ({
    category,
    items: skills.filter((skill) => skill.category === category),
  }));

  return (
    <div className="space-y-4">
      <GlassCard className="p-5" tiltEnabled={false}>
        <p className="text-xs uppercase tracking-wide text-cyan-200/80">Live Preview</p>
        <h2 className="mt-2 text-2xl font-semibold">{basicInfo.fullName || "Your Name"}</h2>
        <p className="text-sm text-muted-foreground">
          {basicInfo.headline || "Student building projects and applying for internships"}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {basicInfo.university ? (
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {basicInfo.university}
              {basicInfo.graduationYear ? ` · ${basicInfo.graduationYear}` : ""}
            </span>
          ) : null}
          {basicInfo.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {basicInfo.location}
            </span>
          ) : null}
        </div>
        {basicInfo.bio ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{basicInfo.bio}</p> : null}
      </GlassCard>

      <GlassCard className="p-5" tiltEnabled={false}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Skills</h3>
        <div className="mt-3 space-y-3">
          {skillGroups.map((group) =>
            group.items.length ? (
              <div key={group.category}>
                <p className="mb-1 text-xs text-muted-foreground">
                  {group.category.charAt(0).toUpperCase() + group.category.slice(1)}s
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null
          )}
          {!skills.length ? <p className="text-sm text-muted-foreground">No skills added yet.</p> : null}
        </div>
      </GlassCard>

      <GlassCard className="p-5" tiltEnabled={false}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Projects</h3>
        <div className="mt-3 space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="font-medium">{project.title}</p>
              {project.description ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{project.description}</p>
              ) : null}
              {project.techStack.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.techStack.map((tag) => (
                    <Badge key={`${project.id}-${tag}`} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {project.link ? (
                <div className="mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Project Link
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {!projects.length ? <p className="text-sm text-muted-foreground">No projects added yet.</p> : null}
        </div>
      </GlassCard>

      <GlassCard className="p-5" tiltEnabled={false}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Experience</h3>
        <div className="mt-3 space-y-3">
          {experiences.map((experience) => (
            <div key={experience.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="font-medium">
                {experience.role} · {experience.company}
              </p>
              <p className="text-xs text-muted-foreground">
                {[experience.startDate || "Start", experience.endDate || "Present"].join(" - ")}
              </p>
              {experience.bullets.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {experience.bullets.map((bullet) => (
                    <li key={`${experience.id}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          {!experiences.length ? <p className="text-sm text-muted-foreground">No experience added yet.</p> : null}
        </div>
      </GlassCard>

      <GlassCard className="p-5" tiltEnabled={false}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Links</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {basicInfo.links.github ? (
            <Button variant="outline" size="sm" asChild>
              <a href={basicInfo.links.github} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-3.5 w-3.5" />
                GitHub
              </a>
            </Button>
          ) : null}
          {basicInfo.links.linkedin ? (
            <Button variant="outline" size="sm" asChild>
              <a href={basicInfo.links.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin className="mr-2 h-3.5 w-3.5" />
                LinkedIn
              </a>
            </Button>
          ) : null}
          {basicInfo.links.website ? (
            <Button variant="outline" size="sm" asChild>
              <a href={basicInfo.links.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Website
              </a>
            </Button>
          ) : null}
          {!basicInfo.links.github && !basicInfo.links.linkedin && !basicInfo.links.website ? (
            <p className="text-sm text-muted-foreground">No links set yet.</p>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
