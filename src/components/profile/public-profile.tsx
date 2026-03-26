import {
  BriefcaseBusiness,
  Download,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";
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

function skillBadgeClass(category: string): string {
  const normalized = category.trim().toLowerCase();
  if (normalized === "language") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200";
  }
  if (normalized === "framework") {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200";
  }
  if (normalized === "tool") {
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200";
  }
  return "";
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
  const hasResume = Boolean(profile.resume_url?.trim());
  const showLinks = hasGithub || hasLinkedin || hasWebsite;
  const bio = profile.bio?.trim();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <FadeIn delay={0}>
        <header className="text-center sm:text-left">
          <div className="relative mb-8">
            <div className="relative h-36 rounded-t-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 sm:h-44">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              />
            </div>
            <div className="relative -mt-16 flex items-end justify-between px-4 sm:px-6">
              <Avatar className="-mt-12 h-28 w-28 ring-4 ring-background shadow-lg">
                {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                <AvatarFallback className="text-lg font-semibold">
                  {initialsFromName(profile.full_name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="w-full space-y-3">
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
        </FadeIn>

        {showLinks ? (
          <FadeIn delay={0.05}>
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
            {hasResume ? (
              <Button variant="outline" size="sm" asChild>
                <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-1.5 h-4 w-4" />
                  Resume
                </a>
              </Button>
            ) : null}
          </div>
          </FadeIn>
        ) : null}

        {bio ? (
          <FadeIn delay={0.1}>
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              About
            </h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
              {bio}
            </p>
          </section>
          </FadeIn>
        ) : null}

        {skillGroups.length > 0 ? (
          <FadeIn delay={0.15}>
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
                      <Badge key={s.id} variant="outline" className={skillBadgeClass(category)}>
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          </FadeIn>
        ) : null}

        {experience.length > 0 ? (
          <FadeIn delay={0.2}>
          <section className="mt-10">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Experience
            </h2>
            <ol className="relative space-y-8 pl-6">
              <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-blue-500 to-purple-500" />
              {experience.map((exp) => (
                <li key={exp.id} className="group relative">
                  <span
                    className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary transition-transform group-hover:scale-125"
                    aria-hidden
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {exp.company}
                      </span>
                      {exp.is_internship ? (
                        <Badge variant="secondary">Internship</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-foreground">{exp.title}</p>
                    <p className="text-sm text-muted-foreground">
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
          </FadeIn>
        ) : null}

        {education.length > 0 ? (
          <FadeIn delay={0.25}>
          <section className="mt-10">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Education
            </h2>
            <ol className="relative space-y-8 pl-6">
              <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-blue-500 to-purple-500" />
              {education.map((edu) => (
                <li key={edu.id} className="group relative">
                  <span
                    className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary transition-transform group-hover:scale-125"
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
          </FadeIn>
        ) : null}

        {projects.length > 0 ? (
          <FadeIn delay={0.3}>
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
                  <Card key={p.id} className="flex h-full flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    {p.image_url?.trim() ? (
                      <div className="overflow-hidden rounded-t-lg">
                        <Image
                          src={p.image_url}
                          alt={`${p.name} preview`}
                          width={640}
                          height={360}
                          className="aspect-video w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg leading-snug">{p.name}</CardTitle>
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
          </FadeIn>
        ) : null}

        <FadeIn delay={0.35}>
          <div className="mt-14 flex items-center justify-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Built with InternIQ
            </a>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
