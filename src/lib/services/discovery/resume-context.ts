import type {
  DiscoveryPreferences,
  DiscoveryResumeContextOverrides,
  DiscoveryResumeContextPreview,
  RemotePreference,
} from "@/types/database";
import type { DiscoveryProfileContext } from "@/lib/server/resume-keywords";

export type DiscoveryPreferencesRow = {
  keywords: string[] | null;
  locations: string[] | null;
  remote_preference: string | null;
  role_types: string[] | null;
  excluded_companies: string[] | null;
  greenhouse_slugs: string[] | null;
  min_match_score: number | null;
  resume_context_enabled: boolean | null;
  resume_context_customized: boolean | null;
  resume_context_overrides: unknown;
  is_active: boolean | null;
  last_discovery_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DiscoverySearchContext = {
  keywords: string[];
  locations: string[];
  roleTypes: string[];
  note: string;
  detectedContext: {
    skills: string[];
    locations: string[];
    role_types: string[];
  };
  effectiveContext: {
    skills: string[];
    locations: string[];
    role_types: string[];
    note: string;
  };
};

const DEFAULT_ROLE_TYPES = ["intern", "entry-level", "junior"];

const CURATED_SKILLS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Python", pattern: /\bpython\b/i },
  { label: "FastAPI", pattern: /\bfastapi\b/i },
  { label: "Redis", pattern: /\bredis\b/i },
  { label: "Docker", pattern: /\bdocker\b/i },
  { label: "PostgreSQL", pattern: /\bpostgres(?:ql)?\b/i },
  { label: "SQL", pattern: /\bsql\b/i },
  { label: "TypeScript", pattern: /\btypescript\b/i },
  { label: "JavaScript", pattern: /\bjavascript\b/i },
  { label: "React", pattern: /\breact\b/i },
  { label: "Node.js", pattern: /\bnode(?:\.js)?\b/i },
  { label: "Next.js", pattern: /\bnext(?:\.js)?\b/i },
  { label: "LLM", pattern: /\bllm\b|large language model/i },
  { label: "RAG", pattern: /\brag\b|retrieval-augmented generation/i },
  { label: "OpenAI", pattern: /\bopenai\b/i },
  { label: "AWS", pattern: /\baws\b|amazon web services/i },
  { label: "GitHub Actions", pattern: /\bgithub actions\b/i },
  { label: "CI/CD", pattern: /\bci\/cd\b/i },
  { label: "Observability", pattern: /\bobservability\b|\bprometheus\b|\bgrafana\b/i },
];

const LOCATION_LABEL_PATTERN =
  /\b(?:location|based in|located in)\s*:?\s*([A-Z][A-Za-z.' -]+(?:,\s*[A-Z][A-Za-z.' -]+){0,2})/gi;
const CITY_REGION_PATTERN =
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,\s*(ON|QC|BC|AB|MB|SK|NS|NB|NL|PE|Canada|USA|United States)\b/g;

const uniqueNonEmpty = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));

const normalizeRemotePreference = (value: string | null | undefined): RemotePreference =>
  value === "remote_only" || value === "hybrid" || value === "onsite" || value === "any"
    ? value
    : "any";

const sameStringArray = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export const defaultResumeContextOverrides = (): DiscoveryResumeContextOverrides => ({
  skills: [],
  locations: [],
  role_types: [],
  note: "",
});

const normalizeResumeContextOverrides = (value: unknown): DiscoveryResumeContextOverrides => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultResumeContextOverrides();
  }
  const record = value as Record<string, unknown>;
  return {
    skills: Array.isArray(record.skills) ? uniqueNonEmpty(record.skills.map(String)) : [],
    locations: Array.isArray(record.locations) ? uniqueNonEmpty(record.locations.map(String)) : [],
    role_types: Array.isArray(record.role_types) ? uniqueNonEmpty(record.role_types.map(String)) : [],
    note: typeof record.note === "string" ? record.note.trim() : "",
  };
};

export const defaultDiscoveryPreferencesRow = (): DiscoveryPreferencesRow => ({
  keywords: [],
  locations: [],
  remote_preference: "any",
  role_types: DEFAULT_ROLE_TYPES,
  excluded_companies: [],
  greenhouse_slugs: [],
  min_match_score: 50,
  resume_context_enabled: true,
  resume_context_customized: false,
  resume_context_overrides: defaultResumeContextOverrides(),
  is_active: true,
  last_discovery_at: null,
  created_at: null,
  updated_at: null,
});

export const mergeDiscoveryPreferencesRow = (
  row: DiscoveryPreferencesRow | null
): DiscoveryPreferencesRow => {
  const defaults = defaultDiscoveryPreferencesRow();
  if (!row) return defaults;
  return {
    keywords: row.keywords ?? defaults.keywords,
    locations: row.locations ?? defaults.locations,
    remote_preference: row.remote_preference ?? defaults.remote_preference,
    role_types: row.role_types ?? defaults.role_types,
    excluded_companies: row.excluded_companies ?? defaults.excluded_companies,
    greenhouse_slugs: row.greenhouse_slugs ?? defaults.greenhouse_slugs,
    min_match_score: row.min_match_score ?? defaults.min_match_score,
    resume_context_enabled: row.resume_context_enabled ?? defaults.resume_context_enabled,
    resume_context_customized: row.resume_context_customized ?? defaults.resume_context_customized,
    resume_context_overrides:
      row.resume_context_overrides ?? defaults.resume_context_overrides,
    is_active: row.is_active ?? defaults.is_active,
    last_discovery_at: row.last_discovery_at ?? defaults.last_discovery_at,
    created_at: row.created_at ?? defaults.created_at,
    updated_at: row.updated_at ?? defaults.updated_at,
  };
};

const buildSkillSignals = (context: DiscoveryProfileContext | null): string[] => {
  if (!context) return [];
  const blob = `${context.resumeText}\n${context.profileContextText}\n${context.profileKeywords.join(" ")}`;
  return uniqueNonEmpty([
    ...context.profileKeywords,
    ...CURATED_SKILLS.filter((candidate) => candidate.pattern.test(blob)).map((candidate) => candidate.label),
  ]).slice(0, 8);
};

const buildRoleTypeSignals = (context: DiscoveryProfileContext | null): string[] => {
  if (!context) return [];
  const blob = `${context.resumeText}\n${context.profileContextText}`.toLowerCase();
  const hasEarlyCareerSignal =
    /\b(intern(ship)?|student|co[\s-]?op|undergrad|undergraduate|college|university|junior)\b/i.test(
      blob
    );
  const hasGraduateSignal = /\b(new grad|graduate)\b/i.test(blob);
  if (hasEarlyCareerSignal || hasGraduateSignal) {
    return DEFAULT_ROLE_TYPES;
  }
  return [];
};

const normalizeLocationCandidate = (value: string): string =>
  value.replace(/\s+/g, " ").replace(/[\s,.;]+$/g, "").trim();

const extractLocationCandidates = (text: string): string[] => {
  if (!text.trim()) return [];

  const candidates: string[] = [];
  const locationLabelPattern = new RegExp(LOCATION_LABEL_PATTERN.source, LOCATION_LABEL_PATTERN.flags);
  const cityRegionPattern = new RegExp(CITY_REGION_PATTERN.source, CITY_REGION_PATTERN.flags);

  let match: RegExpExecArray | null;
  while ((match = locationLabelPattern.exec(text)) !== null) {
    const candidate = normalizeLocationCandidate(match[1] ?? "");
    if (candidate) candidates.push(candidate);
  }

  while ((match = cityRegionPattern.exec(text)) !== null) {
    const city = normalizeLocationCandidate(match[1] ?? "");
    const region = normalizeLocationCandidate(match[2] ?? "");
    if (city && region) candidates.push(`${city}, ${region}`);
  }

  if (/\bremote\b/i.test(text)) {
    candidates.push("Remote");
  }

  return uniqueNonEmpty(candidates);
};

const buildLocationSignals = (context: DiscoveryProfileContext | null): string[] => {
  if (!context) return [];
  return uniqueNonEmpty([
    context.profileLocation,
    ...extractLocationCandidates(context.profileContextText),
    ...extractLocationCandidates(context.resumeText),
  ]).slice(0, 3);
};

const formatList = (values: string[], fallback: string): string => {
  if (values.length === 0) return fallback;
  if (values.length === 1) return values[0]!;
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, 2).join(", ")}, and ${values[2]}`;
};

const buildPreviewSummary = (input: {
  hasResume: boolean;
  resumeContextEnabled: boolean;
  effectiveSkills: string[];
  effectiveLocations: string[];
  effectiveRoleTypes: string[];
  remotePreference: RemotePreference;
  note: string;
  hasAdvancedFilters: boolean;
}): string => {
  const skillsText = formatList(input.effectiveSkills, "broad discovery terms");
  const mentionsRemoteFriendlyRoles =
    input.effectiveLocations.length > 0 &&
    input.remotePreference !== "onsite" &&
    !input.effectiveLocations.some((location) => /^remote$/i.test(location.trim()));
  const locationText = input.effectiveLocations.length
    ? mentionsRemoteFriendlyRoles
      ? ` around ${formatList(input.effectiveLocations, "your preferred locations")} plus remote-friendly roles`
      : ` around ${formatList(input.effectiveLocations, "your preferred locations")}`
    : "";
  const roleText = input.effectiveRoleTypes.length
    ? ` for ${formatList(input.effectiveRoleTypes, "your preferred roles")} roles`
    : "";
  const noteText = input.note ? " Custom notes will also guide the search." : "";
  const advancedText = input.hasAdvancedFilters ? " Advanced filters are also applied." : "";

  if (!input.hasResume && !input.resumeContextEnabled) {
    return `Resume context is off. Discover will use your saved context for ${skillsText}${locationText}${roleText}.${noteText}${advancedText}`;
  }
  if (!input.hasResume) {
    return `No resume detected yet. Discover will use your saved context for ${skillsText}${locationText}${roleText}.${noteText}${advancedText}`;
  }
  if (!input.resumeContextEnabled) {
    return `Resume context is off. Discover will use your saved context for ${skillsText}${locationText}${roleText}.${noteText}${advancedText}`;
  }

  return `Using your latest resume to look for ${skillsText}${locationText}${roleText}.${noteText}${advancedText}`;
};

export const buildResumeContextPreview = (input: {
  profileContext: DiscoveryProfileContext | null;
  preferences: DiscoveryPreferencesRow;
}): DiscoveryResumeContextPreview => {
  const prefs = mergeDiscoveryPreferencesRow(input.preferences);
  const overrides = normalizeResumeContextOverrides(prefs.resume_context_overrides);
  const detectedSkills = buildSkillSignals(input.profileContext);
  const detectedLocations = buildLocationSignals(input.profileContext);
  const detectedRoleTypes = buildRoleTypeSignals(input.profileContext);
  const hasResume = Boolean(input.profileContext?.resumeText.trim());

  const effectiveSkills =
    prefs.resume_context_enabled
      ? prefs.resume_context_customized
        ? overrides.skills
        : detectedSkills
      : overrides.skills;
  const effectiveLocations =
    prefs.resume_context_enabled
      ? prefs.resume_context_customized
        ? overrides.locations
        : detectedLocations
      : overrides.locations;
  const effectiveRoleTypes =
    prefs.resume_context_enabled
      ? prefs.resume_context_customized
        ? overrides.role_types
        : detectedRoleTypes
      : overrides.role_types;

  const hasAdvancedFilters =
    (prefs.keywords?.length ?? 0) > 0 ||
    (prefs.locations?.length ?? 0) > 0 ||
    !sameStringArray(prefs.role_types ?? [], DEFAULT_ROLE_TYPES);

  return {
    has_resume: hasResume,
    detected_skills: detectedSkills,
    detected_locations: detectedLocations,
    detected_role_types: detectedRoleTypes,
    effective_skills: effectiveSkills,
    effective_locations: effectiveLocations,
    effective_role_types: effectiveRoleTypes,
    summary: buildPreviewSummary({
      hasResume,
      resumeContextEnabled: Boolean(prefs.resume_context_enabled),
      effectiveSkills,
      effectiveLocations,
      effectiveRoleTypes,
      remotePreference: normalizeRemotePreference(prefs.remote_preference),
      note: overrides.note,
      hasAdvancedFilters,
    }),
  };
};

const parseNoteKeywords = (note: string): string[] => {
  if (!note.trim()) return [];
  const segmented = note
    .split(/[,;\n]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  if (segmented.length > 0) return uniqueNonEmpty(segmented).slice(0, 4);
  return [note.trim()];
};

export const buildDiscoverySearchContext = (input: {
  preferences: DiscoveryPreferencesRow;
  preview: DiscoveryResumeContextPreview;
}): DiscoverySearchContext => {
  const prefs = mergeDiscoveryPreferencesRow(input.preferences);
  const overrides = normalizeResumeContextOverrides(prefs.resume_context_overrides);

  return {
    keywords: uniqueNonEmpty([
      ...input.preview.effective_skills,
      ...parseNoteKeywords(overrides.note),
      ...(prefs.keywords ?? []),
    ]),
    locations: uniqueNonEmpty([
      ...input.preview.effective_locations,
      ...(prefs.locations ?? []),
    ]),
    roleTypes: uniqueNonEmpty([
      ...input.preview.effective_role_types,
      ...(prefs.role_types ?? []),
    ]),
    note: overrides.note,
    detectedContext: {
      skills: input.preview.detected_skills,
      locations: input.preview.detected_locations,
      role_types: input.preview.detected_role_types,
    },
    effectiveContext: {
      skills: uniqueNonEmpty([
        ...input.preview.effective_skills,
        ...(prefs.keywords ?? []),
        ...parseNoteKeywords(overrides.note),
      ]),
      locations: uniqueNonEmpty([
        ...input.preview.effective_locations,
        ...(prefs.locations ?? []),
      ]),
      role_types: uniqueNonEmpty([
        ...input.preview.effective_role_types,
        ...(prefs.role_types ?? []),
      ]),
      note: overrides.note,
    },
  };
};

export const buildDiscoveryPreferencesResponse = (input: {
  userId: string;
  row: DiscoveryPreferencesRow | null;
  profileContext?: DiscoveryProfileContext | null;
}): DiscoveryPreferences => {
  const prefs = mergeDiscoveryPreferencesRow(input.row);
  const overrides = normalizeResumeContextOverrides(prefs.resume_context_overrides);
  const preview = buildResumeContextPreview({
    profileContext: input.profileContext ?? null,
    preferences: prefs,
  });

  return {
    user_id: input.userId,
    keywords: prefs.keywords ?? [],
    locations: prefs.locations ?? [],
    remote_preference: normalizeRemotePreference(prefs.remote_preference),
    role_types: prefs.role_types ?? [],
    excluded_companies: prefs.excluded_companies ?? [],
    greenhouse_slugs: prefs.greenhouse_slugs ?? [],
    min_match_score: prefs.min_match_score ?? 50,
    resume_context_enabled: Boolean(prefs.resume_context_enabled),
    resume_context_customized: Boolean(prefs.resume_context_customized),
    resume_context_overrides: overrides,
    resume_context_preview: preview,
    is_active: Boolean(prefs.is_active),
    last_discovery_at: prefs.last_discovery_at ?? null,
    created_at: prefs.created_at ?? new Date().toISOString(),
    updated_at: prefs.updated_at ?? new Date().toISOString(),
  };
};

export const parseDiscoveryPreferencesBody = (body: Record<string, unknown>) => ({
  keywords: Array.isArray(body.keywords) ? uniqueNonEmpty(body.keywords.map(String)) : undefined,
  locations: Array.isArray(body.locations) ? uniqueNonEmpty(body.locations.map(String)) : undefined,
  role_types: Array.isArray(body.role_types) ? uniqueNonEmpty(body.role_types.map(String)) : undefined,
  excluded_companies: Array.isArray(body.excluded_companies)
    ? uniqueNonEmpty(body.excluded_companies.map(String))
    : undefined,
  greenhouse_slugs: Array.isArray(body.greenhouse_slugs)
    ? uniqueNonEmpty(body.greenhouse_slugs.map(String).map((value) => value.toLowerCase().replace(/\s+/g, "-")))
    : undefined,
  resume_context_enabled:
    typeof body.resume_context_enabled === "boolean" ? body.resume_context_enabled : undefined,
  resume_context_customized:
    typeof body.resume_context_customized === "boolean" ? body.resume_context_customized : undefined,
  resume_context_overrides:
    body.resume_context_overrides !== undefined
      ? normalizeResumeContextOverrides(body.resume_context_overrides)
      : undefined,
});
