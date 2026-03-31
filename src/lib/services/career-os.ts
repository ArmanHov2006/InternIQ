import type {
  Application,
  ApplicationArtifact,
  ApplicationContact,
  Experience,
  MatchInsight,
  Profile,
  Project,
  Resume,
} from "@/types/database";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "you",
  "your",
]);

const normalizeToken = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9+#.\-]/g, "");

const tokenize = (value: string): string[] =>
  value
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

export const inferBoardFromUrl = (jobUrl: string): string => {
  try {
    const hostname = new URL(jobUrl).hostname.replace(/^www\./, "").toLowerCase();
    if (hostname.includes("linkedin")) return "LinkedIn";
    if (hostname.includes("indeed")) return "Indeed";
    if (hostname.includes("greenhouse")) return "Greenhouse";
    if (hostname.includes("lever")) return "Lever";
    if (hostname.includes("workday")) return "Workday";
    if (hostname.includes("ashby")) return "Ashby";
    return hostname.split(".")[0] || "Company Site";
  } catch {
    return "Manual";
  }
};

export const buildOpportunityDedupeKey = (input: {
  company: string;
  role: string;
  job_url?: string | null;
  external_job_id?: string | null;
}): string => {
  const external = input.external_job_id?.trim().toLowerCase();
  if (external) return `external:${external}`;
  const url = input.job_url?.trim().toLowerCase();
  if (url) return `url:${url}`;
  return `role:${input.company.trim().toLowerCase()}::${input.role.trim().toLowerCase()}`;
};

const uniqueTopTokens = (value: string, limit = 10): string[] => {
  const counts = new Map<string, number>();
  for (const token of tokenize(value)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
};

export const computeMatchInsight = (input: {
  jobDescription: string;
  resumeText?: string;
  profileKeywords?: string[];
}): MatchInsight => {
  const jobKeywords = uniqueTopTokens(input.jobDescription, 12);
  const comparisonCorpus = [
    input.resumeText ?? "",
    ...(input.profileKeywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
  const matched = jobKeywords.filter((keyword) => comparisonCorpus.includes(keyword));
  const missing = jobKeywords.filter((keyword) => !comparisonCorpus.includes(keyword));
  const ratio = jobKeywords.length === 0 ? 0 : matched.length / jobKeywords.length;
  const score = Math.max(28, Math.min(98, Math.round(28 + ratio * 72)));

  const matchedSummary = matched.length
    ? `Strong overlap on ${matched.slice(0, 4).join(", ")}`
    : "Needs stronger keyword alignment";
  const missingSummary = missing.length
    ? `Missing ${missing.slice(0, 3).join(", ")}`
    : "Coverage looks strong";

  return {
    score,
    summary: `${matchedSummary}. ${missingSummary}.`,
    matched_keywords: matched,
    missing_keywords: missing,
  };
};

const extractProjectEvidence = (projects: Project[]): string[] =>
  projects
    .slice(0, 3)
    .map((project) => {
      const tech = Array.isArray(project.tech_stack) && project.tech_stack.length
        ? ` using ${project.tech_stack.slice(0, 4).join(", ")}`
        : "";
      return `${project.name}: ${project.description || "Relevant shipped work"}${tech}`.trim();
    });

const extractExperienceEvidence = (experience: Experience[]): string[] =>
  experience.slice(0, 3).map((entry) => `${entry.title} at ${entry.company}`);

export const buildProofPack = (input: {
  application: Application;
  profile: Profile | null;
  projects: Project[];
  experience: Experience[];
  resume: Resume | null;
  contacts: ApplicationContact[];
}): {
  artifactTitle: string;
  shareSlug: string;
  recruiterNote: string;
  evidenceBullets: string[];
  valueNarrative: string;
  packContent: string;
} => {
  const firstName =
    input.profile?.full_name?.trim().split(/\s+/)[0] ||
    input.contacts[0]?.name?.trim().split(/\s+/)[0] ||
    "there";
  const recruiterTarget = input.contacts[0]?.name?.trim() || "Hiring Team";
  const evidenceBullets = [
    ...extractExperienceEvidence(input.experience),
    ...extractProjectEvidence(input.projects),
  ].slice(0, 4);
  const valueNarrative = [
    input.profile?.headline?.trim(),
    input.profile?.bio?.trim(),
    input.resume?.parsed_text?.trim().slice(0, 240),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const recruiterNote = [
    `Hi ${recruiterTarget},`,
    `I put together a focused proof-of-fit pack for the ${input.application.role} role at ${input.application.company}.`,
    evidenceBullets.length
      ? `The strongest evidence is ${evidenceBullets.slice(0, 2).join(" and ")}.`
      : `${firstName} has relevant experience and a tailored interest in this role.`,
    "Happy to share more detail or walk through a project relevant to the team.",
  ].join("\n\n");

  const shareSlug = `${input.application.company}-${input.application.role}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  const packContent = JSON.stringify(
    {
      company: input.application.company,
      role: input.application.role,
      headline: input.profile?.headline || input.application.role,
      recruiterNote,
      evidenceBullets,
      valueNarrative,
      contact: input.contacts[0] ?? null,
    },
    null,
    2
  );

  return {
    artifactTitle: `${input.application.company} proof pack`,
    shareSlug,
    recruiterNote,
    evidenceBullets,
    valueNarrative,
    packContent,
  };
};

export const parseProofPackArtifact = (
  artifact: ApplicationArtifact | null
): {
  company?: string;
  role?: string;
  headline?: string;
  recruiterNote?: string;
  evidenceBullets?: string[];
  valueNarrative?: string;
  contact?: { name?: string; email?: string } | null;
} | null => {
  if (!artifact?.content?.trim()) return null;
  try {
    return JSON.parse(artifact.content) as {
      company?: string;
      role?: string;
      headline?: string;
      recruiterNote?: string;
      evidenceBullets?: string[];
      valueNarrative?: string;
      contact?: { name?: string; email?: string } | null;
    };
  } catch {
    return null;
  }
};
