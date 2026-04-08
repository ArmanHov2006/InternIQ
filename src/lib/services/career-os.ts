import type {
  Application,
  ApplicationArtifact,
  ApplicationContact,
  Experience,
  MatchInsight,
  Profile,
  Project,
  RemotePreference,
  Resume,
} from "@/types/database";
import type { DiscoveryGatingFlag } from "@/lib/services/discovery/ai-scorer";

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

/** Generic job-description filler words that dilute scoring if picked as top tokens. */
const JOB_NOISE_WORDS = new Set([
  "experience",
  "team",
  "work",
  "working",
  "company",
  "role",
  "position",
  "requirements",
  "required",
  "ability",
  "skills",
  "strong",
  "including",
  "will",
  "our",
  "about",
  "join",
  "looking",
  "ideal",
  "candidate",
  "must",
  "have",
  "years",
  "opportunity",
  "responsibilities",
  "qualifications",
  "apply",
  "please",
  "what",
  "who",
  "how",
  "also",
  "well",
  "can",
  "using",
  "new",
  "make",
  "help",
  "across",
  "like",
  "based",
  "within",
  "knowledge",
  "understanding",
  "environment",
  "part",
  "building",
  "ensure",
]);

const KNOWN_SKILL_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "python", pattern: /\bpython\b/i },
  { label: "fastapi", pattern: /\bfastapi\b/i },
  { label: "django", pattern: /\bdjango\b/i },
  { label: "typescript", pattern: /\btypescript\b/i },
  { label: "javascript", pattern: /\bjavascript\b/i },
  { label: "react", pattern: /\breact\b/i },
  { label: "node", pattern: /\bnode(?:\.js)?\b/i },
  { label: "redis", pattern: /\bredis\b/i },
  { label: "docker", pattern: /\bdocker\b/i },
  { label: "kubernetes", pattern: /\bkubernetes\b|\bk8s\b/i },
  { label: "postgresql", pattern: /\bpostgres(?:ql)?\b/i },
  { label: "sql", pattern: /\bsql\b/i },
  { label: "aws", pattern: /\baws\b|amazon web services/i },
  { label: "gcp", pattern: /\bgcp\b|google cloud/i },
  { label: "azure", pattern: /\bazure\b/i },
  { label: "graphql", pattern: /\bgraphql\b/i },
  { label: "java", pattern: /\bjava\b/i },
  { label: "c++", pattern: /\bc\+\+\b/i },
  { label: "go", pattern: /\bgolang\b|\bgo\b/i },
  { label: "llm", pattern: /\bllm\b|large language model/i },
  { label: "rag", pattern: /\brag\b|retrieval-augmented generation/i },
  { label: "machine learning", pattern: /\bmachine learning\b|\bml\b/i },
  { label: "analytics", pattern: /\banalytics\b|\bexperimentation\b/i },
];

const normalizeToken = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9+#.\-]/g, "");

/**
 * Normalize a multi-word keyword (e.g. "PII Detection") by splitting into
 * individual words so each part can match independently against job text.
 */
const normalizeKeywordParts = (value: string): string[] => {
  const parts = value
    .trim()
    .toLowerCase()
    .split(/[\s/\\,;]+/)
    .map((p) => p.replace(/[^a-z0-9+#.\-]/g, ""))
    .filter((p) => p.length >= 2 && !STOP_WORDS.has(p));
  return parts;
};

const tokenize = (value: string): string[] =>
  value
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

const uniqueNonEmpty = (values: string[]): string[] =>
  Array.from(new Set(values.filter(Boolean)));

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const ENTRY_LEVEL_ROLE_TYPE_REGEX = /\b(intern(ship)?|junior|entry[\s-]?level|co[\s-]?op|new grad|graduate)\b/i;
const JUNIOR_TITLE_REGEX = /\b(intern(ship)?|junior|entry[\s-]?level|co[\s-]?op|new grad|graduate|student)\b/i;
const SENIOR_TITLE_REGEX = /\b(senior|sr\.?|staff|lead|architect|manager|head)\b/i;
const EXECUTIVE_TITLE_REGEX = /\b(principal|director|vice president|vp|chief)\b/i;

type SeniorityBand = "junior" | "neutral" | "senior" | "executive";

type SenioritySignal = {
  band: SeniorityBand;
  delta: number;
  note: string;
  gatingFlags: DiscoveryGatingFlag[];
};

type HeuristicSignal = {
  delta: number;
  note: string;
  gatingFlags: DiscoveryGatingFlag[];
};

export const hasEntryLevelRoleTypes = (roleTypes?: string[]): boolean =>
  Array.isArray(roleTypes) && roleTypes.some((roleType) => ENTRY_LEVEL_ROLE_TYPE_REGEX.test(roleType));

export const classifyJobTitleSeniority = (jobTitle?: string): SeniorityBand => {
  const title = jobTitle?.trim().toLowerCase() ?? "";
  if (!title) return "neutral";
  if (EXECUTIVE_TITLE_REGEX.test(title)) return "executive";
  if (SENIOR_TITLE_REGEX.test(title)) return "senior";
  if (JUNIOR_TITLE_REGEX.test(title)) return "junior";
  return "neutral";
};

export const isEntryLevelSeniorityMismatch = (jobTitle: string, roleTypes?: string[]): boolean => {
  if (!hasEntryLevelRoleTypes(roleTypes)) return false;
  const band = classifyJobTitleSeniority(jobTitle);
  return band === "senior" || band === "executive";
};

export const detectSenioritySignal = (
  jobTitle?: string,
  roleTypes?: string[]
): SenioritySignal => {
  if (!hasEntryLevelRoleTypes(roleTypes)) {
    return { band: "neutral", delta: 0, note: "", gatingFlags: [] };
  }

  const band = classifyJobTitleSeniority(jobTitle);
  if (band === "junior") {
    return {
      band,
      delta: 10,
      note: "Title matches your entry-level search.",
      gatingFlags: [],
    };
  }
  if (band === "executive") {
    return {
      band,
      delta: -34,
      note: "Title signals a principal or director-level role for an entry-level search.",
      gatingFlags: ["seniority_mismatch"],
    };
  }
  if (band === "senior") {
    return {
      band,
      delta: -22,
      note: "Title signals a senior-level role for an entry-level search.",
      gatingFlags: ["seniority_mismatch"],
    };
  }

  return {
    band,
    delta: 0,
    note: "Title has no clear entry-level signal.",
    gatingFlags: [],
  };
};

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

export const buildApiDedupeKey = (apiSource: string, apiJobId: string): string =>
  `${apiSource.trim().toLowerCase()}::${apiJobId.trim().toLowerCase()}`;

const uniqueTopTokens = (value: string, limit = 10): string[] => {
  const counts = new Map<string, number>();
  for (const token of tokenize(value)) {
    if (JOB_NOISE_WORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
};

const extractKnownSkills = (value: string): string[] =>
  uniqueNonEmpty(
    KNOWN_SKILL_PATTERNS.filter((candidate) => candidate.pattern.test(value)).map(
      (candidate) => candidate.label
    )
  );

const extractYearsRequirement = (value: string): number | null => {
  const regex = /(\d+)(?:\s*(?:-|to)\s*(\d+))?\+?\s+years?/gi;
  let highest: number | null = null;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value)) !== null) {
    const first = Number(match[1] ?? 0);
    const second = Number(match[2] ?? 0);
    const candidate = Math.max(first, second || 0);
    if (!Number.isFinite(candidate) || candidate <= 0) continue;
    highest = highest == null ? candidate : Math.max(highest, candidate);
  }
  return highest;
};

const normalizeLocationText = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

const detectYearsSignal = (jobDescription: string, roleTypes?: string[]): HeuristicSignal => {
  if (!hasEntryLevelRoleTypes(roleTypes)) {
    return { delta: 0, note: "", gatingFlags: [] };
  }

  const yearsRequired = extractYearsRequirement(jobDescription);
  if (yearsRequired == null) {
    return { delta: 0, note: "", gatingFlags: [] };
  }
  if (yearsRequired >= 5) {
    return {
      delta: -28,
      note: `Posting asks for ${yearsRequired}+ years of experience, which is a tough fit for an entry-level search.`,
      gatingFlags: ["years_mismatch"],
    };
  }
  if (yearsRequired >= 3) {
    return {
      delta: -16,
      note: `Posting asks for ${yearsRequired}+ years of experience, so this is more of a stretch for entry-level roles.`,
      gatingFlags: ["years_mismatch"],
    };
  }
  if (yearsRequired >= 2) {
    return {
      delta: -6,
      note: `Posting asks for ${yearsRequired}+ years of experience, so this may be a stretch for early-career roles.`,
      gatingFlags: [],
    };
  }
  if (yearsRequired <= 1) {
    return {
      delta: 4,
      note: "Experience requirement still looks entry-level friendly.",
      gatingFlags: [],
    };
  }
  return { delta: 0, note: "", gatingFlags: [] };
};

const detectLocationSignal = (input: {
  jobDescription: string;
  jobLocation?: string;
  preferredLocations?: string[];
  remotePreference?: RemotePreference;
}): HeuristicSignal => {
  const combinedLocationText = [input.jobLocation, input.jobDescription].filter(Boolean).join(" ");
  const normalizedCombined = normalizeLocationText(combinedLocationText);
  const normalizedPreferred = (input.preferredLocations ?? [])
    .map(normalizeLocationText)
    .filter(Boolean);
  const isRemote = /\bremote\b/i.test(combinedLocationText);
  const isHybrid = /\bhybrid\b/i.test(combinedLocationText);
  const isOnsite = /\bon[\s-]?site\b/i.test(combinedLocationText);

  let delta = 0;
  const notes: string[] = [];
  const gatingFlags: DiscoveryGatingFlag[] = [];

  if (input.remotePreference === "remote_only" && !isRemote) {
    delta -= 18;
    notes.push("Role is not clearly remote.");
    gatingFlags.push("remote_mismatch");
  } else if (input.remotePreference === "hybrid" && !(isRemote || isHybrid)) {
    delta -= 10;
    notes.push("Role does not read as remote or hybrid.");
    gatingFlags.push("location_mismatch");
  } else if (input.remotePreference === "onsite" && isRemote && !isOnsite) {
    delta -= 8;
    notes.push("Role looks primarily remote.");
    gatingFlags.push("remote_mismatch");
  } else if (input.remotePreference === "remote_only" && isRemote) {
    delta += 5;
  }

  if (normalizedPreferred.length > 0 && !isRemote) {
    const matchesPreferred = normalizedPreferred.some((location) => {
      return normalizedCombined.includes(location) || location.includes(normalizedCombined);
    });
    if (!matchesPreferred) {
      delta -= 10;
      notes.push("Location does not match your saved discovery locations.");
      gatingFlags.push("location_mismatch");
    } else {
      delta += 4;
    }
  }

  return {
    delta,
    note: notes.join(" "),
    gatingFlags: Array.from(new Set(gatingFlags)),
  };
};

const detectMustHaveSignal = (input: {
  jobDescription: string;
  comparisonCorpus: string;
}): {
  matchedSkills: string[];
  missingSkills: string[];
  signal: HeuristicSignal;
} => {
  const knownJobSkills = extractKnownSkills(input.jobDescription);
  if (knownJobSkills.length === 0) {
    return {
      matchedSkills: [],
      missingSkills: [],
      signal: { delta: 0, note: "", gatingFlags: [] },
    };
  }

  const matchedSkills = knownJobSkills.filter((skill) => input.comparisonCorpus.includes(skill));
  const missingSkills = knownJobSkills.filter((skill) => !input.comparisonCorpus.includes(skill));
  const missingRatio = missingSkills.length / knownJobSkills.length;

  if (missingSkills.length === 0) {
    return {
      matchedSkills,
      missingSkills,
      signal: {
        delta: Math.min(8, matchedSkills.length * 2),
        note: "Core tools line up well with your background.",
        gatingFlags: [],
      },
    };
  }
  let delta = 0;
  if (matchedSkills.length >= 2 && missingRatio <= 0.4) {
    delta = 2;
  } else if (matchedSkills.length >= 1 && missingRatio < 0.6) {
    delta = -2;
  } else if (matchedSkills.length >= 1) {
    delta = -6;
  } else {
    delta = -10;
  }
  const gatingFlags =
    missingRatio >= 0.75 || matchedSkills.length === 0
      ? (["missing_must_have"] as DiscoveryGatingFlag[])
      : [];

  return {
    matchedSkills,
    missingSkills,
    signal: {
      delta,
      note: `Potential must-have gaps: ${missingSkills.slice(0, 3).join(", ")}.`,
      gatingFlags,
    },
  };
};

export const computeMatchInsight = (input: {
  jobDescription: string;
  resumeText?: string;
  profileContextText?: string;
  profileKeywords?: string[];
  jobTitle?: string;
  roleTypes?: string[];
  jobLocation?: string;
  preferredLocations?: string[];
  remotePreference?: RemotePreference;
}): MatchInsight => {
  const jobKeywords = uniqueTopTokens(input.jobDescription, 12);
  const jobText = input.jobDescription.toLowerCase();
  const normalizedProfileKeywords = uniqueNonEmpty(
    (input.profileKeywords ?? [])
      .flatMap(normalizeKeywordParts)
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
  );
  const explicitProfileHits = normalizedProfileKeywords.filter((keyword) => jobText.includes(keyword));
  const comparisonCorpus = [
    input.profileContextText ?? "",
    input.resumeText ?? "",
    ...normalizedProfileKeywords,
  ]
    .join(" ")
    .toLowerCase();
  const mustHave = detectMustHaveSignal({
    jobDescription: input.jobDescription,
    comparisonCorpus,
  });
  const matched = uniqueNonEmpty([
    ...jobKeywords.filter((keyword) => comparisonCorpus.includes(keyword)),
    ...explicitProfileHits,
    ...mustHave.matchedSkills,
  ]);
  const missing = uniqueNonEmpty([
    ...jobKeywords.filter((keyword) => !comparisonCorpus.includes(keyword)),
    ...mustHave.missingSkills,
  ]);
  const weightedSignals = uniqueNonEmpty([
    ...jobKeywords,
    ...explicitProfileHits,
    ...mustHave.matchedSkills,
    ...mustHave.missingSkills,
  ]);
  const ratio = weightedSignals.length === 0 ? 0 : matched.length / weightedSignals.length;
  const explicitBoost = Math.min(12, explicitProfileHits.length * 3);
  const seniority = detectSenioritySignal(input.jobTitle, input.roleTypes);
  const years = detectYearsSignal(input.jobDescription, input.roleTypes);
  const location = detectLocationSignal({
    jobDescription: input.jobDescription,
    jobLocation: input.jobLocation,
    preferredLocations: input.preferredLocations,
    remotePreference: input.remotePreference,
  });
  const score = clamp(
    Math.round(
      34 +
        ratio * 46 +
        explicitBoost +
        mustHave.signal.delta +
        seniority.delta +
        years.delta +
        location.delta
    ),
    20,
    84
  );

  const matchedSummary = matched.length
    ? `Fast match found overlap on ${matched.slice(0, 4).join(", ")}`
    : "Needs stronger keyword alignment";
  const missingSummary = missing.length
    ? `Missing ${missing.slice(0, 3).join(", ")}`
    : "Coverage looks strong";
  const summaryParts = [matchedSummary, missingSummary];
  if (seniority.note) {
    summaryParts.push(seniority.note);
  }
  if (years.note) {
    summaryParts.push(years.note);
  }
  if (location.note) {
    summaryParts.push(location.note);
  }
  if (mustHave.signal.note) {
    summaryParts.push(mustHave.signal.note);
  }

  return {
    score,
    summary: `${summaryParts.join(". ")}.`,
    matched_keywords: matched,
    missing_keywords: missing,
    gating_flags: uniqueNonEmpty([
      ...seniority.gatingFlags,
      ...years.gatingFlags,
      ...location.gatingFlags,
      ...mustHave.signal.gatingFlags,
    ]),
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
