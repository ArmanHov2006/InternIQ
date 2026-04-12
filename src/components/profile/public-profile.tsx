import {
  Briefcase,
  CalendarRange,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  Education,
  Experience,
  Profile,
  Project,
  Skill,
} from "@/types/database";

export type PublicProfileProps = {
  profile: Profile;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
};

function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (d: string | null) => {
    if (!d) return null;
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return d;
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };
  const s = fmt(start);
  const e = fmt(end);
  if (!s && !e) return "";
  if (s && !e) return `${s} – Present`;
  return `${s ?? ""} – ${e ?? ""}`;
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function groupSkillsByCategory(skills: Skill[]): { category: string; items: Skill[] }[] {
  const map = new Map<string, Skill[]>();
  for (const s of skills) {
    const cat = s.category?.trim() || "Other";
    const list = map.get(cat);
    if (list) list.push(s);
    else map.set(cat, [s]);
  }
  const entries = Array.from(map.entries()).map(([category, items]) => ({
    category,
    items: [...items].sort(
      (a: Skill, b: Skill) => a.display_order - b.display_order
    ),
  }));
  entries.sort((a, b) => {
    const minA = Math.min(
      ...a.items.map((i: Skill) => i.display_order)
    );
    const minB = Math.min(
      ...b.items.map((i: Skill) => i.display_order)
    );
    return minA - minB;
  });
  return entries;
}

export function PublicProfile({
  profile,
  education,
  experience,
  projects,
  skills,
}: PublicProfileProps) {
  const skillGroups = groupSkillsByCategory(skills);
  const hasGithub = Boolean(profile.github_url?.trim());
  const hasLinkedin = Boolean(profile.linkedin_url?.trim());
  const hasWebsite = Boolean(profile.website_url?.trim());
  const showLinks = hasGithub || hasLinkedin || hasWebsite;
  const bio = profile.bio?.trim();
  const totalProjects = projects.length;
  const totalExperience = experience.length;
  const totalSkills = skills.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <GlassCard className="p-6 sm:p-8" tiltEnabled={false}>
          <header className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
            <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="" />
              ) : null}
              <AvatarFallback className="text-lg font-semibold">
                {initialsFromName(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-6 w-full space-y-3 sm:mt-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>InternIQ Portfolio</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {profile.full_name}
              </h1>
              {profile.headline ? (
                <p className="text-lg text-muted-foreground">{profile.headline}</p>
              ) : null}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {profile.location ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                    {profile.location}
                  </span>
                ) : null}
                {profile.is_open_to_work ? (
                  <Badge variant="secondary" className="font-medium">
                    Open to work
                  </Badge>
                ) : null}
              </div>
            </div>
          </header>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Projects</p>
              <p className="mt-1 text-lg font-semibold">{totalProjects}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="mt-1 text-lg font-semibold">{totalExperience}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Skills</p>
              <p className="mt-1 text-lg font-semibold">{totalSkills}</p>
            </div>
          </div>
        </GlassCard>

        {showLinks ? (
          <div className="mt-8 flex flex-wrap justify-center gap-2 sm:justify-start">
            {hasGithub ? (
              <Button variant="outline" size="icon" asChild>
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
            {hasLinkedin ? (
              <Button variant="outline" size="icon" asChild>
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
            {hasWebsite ? (
              <Button variant="outline" size="icon" asChild>
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Website"
                >
                  <Globe className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}

        {bio ? (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <GradientText>About</GradientText>
            </h2>
            <GlassCard className="p-5" tiltEnabled={false}>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                {bio}
              </p>
            </GlassCard>
          </section>
        ) : null}

        {skillGroups.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Skills
            </h2>
            <div className="space-y-6">
              {skillGroups.map(({ category, items }) => (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-medium text-foreground">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => (
                      <Badge key={s.id} variant="outline">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {experience.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Experience
            </h2>
            <ol className="relative space-y-8 border-l border-border pl-6">
              {experience.map((exp) => (
                <li key={exp.id} className="relative">
                  <span
                    className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary"
                    aria-hidden
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {exp.company}
                      </span>
                      {exp.is_internship ? (
                        <Badge variant="secondary">Internship/Co-op</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-foreground">{exp.title}</p>
                    <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarRange className="h-3.5 w-3.5" />
                      {formatDateRange(exp.start_date, exp.end_date)}
                      {exp.location ? ` · ${exp.location}` : ""}
                    </p>
                    {exp.description?.trim() ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {exp.description.trim()}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {education.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Education
            </h2>
            <ol className="relative space-y-8 border-l border-border pl-6">
              {education.map((edu) => (
                <li key={edu.id} className="relative">
                  <span
                    className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary"
                    aria-hidden
                  />
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{edu.school}</p>
                    <p className="text-sm text-foreground">
                      {[edu.degree, edu.field_of_study].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateRange(edu.start_date, edu.end_date)}
                      {edu.gpa?.trim() ? ` · GPA ${edu.gpa.trim()}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {projects.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Projects
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {projects.map((p) => {
                const hasLive = Boolean(p.live_url?.trim());
                const hasProjectGithub = Boolean(p.github_url?.trim());
                const tech = Array.isArray(p.tech_stack) ? p.tech_stack : [];

                return (
                  <Card key={p.id} className="flex h-full flex-col border-white/10 bg-white/[0.03]">
                    <CardHeader className="pb-3">
                      <CardTitle className="inline-flex items-center gap-2 text-lg leading-snug">
                        <Briefcase className="h-4 w-4 text-primary" />
                        {p.name}
                      </CardTitle>
                      {p.description?.trim() ? (
                        <CardDescription className="line-clamp-4 whitespace-pre-wrap">
                          {p.description.trim()}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    {tech.length > 0 ? (
                      <CardContent className="pb-3 pt-0">
                        <div className="flex flex-wrap gap-1.5">
                          {tech.map((t, idx) => (
                            <Badge
                              key={`${p.id}-${idx}-${t}`}
                              variant="secondary"
                              className="font-normal"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    ) : null}
                    {(hasLive || hasProjectGithub) && (
                      <CardFooter className="mt-auto flex flex-wrap gap-2 pt-0">
                        {hasLive ? (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={p.live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                              Live
                            </a>
                          </Button>
                        ) : null}
                        {hasProjectGithub ? (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={p.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Github className="mr-1.5 h-3.5 w-3.5" />
                              Code
                            </a>
                          </Button>
                        ) : null}
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
