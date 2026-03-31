import type { Application } from "@/types/database";
import { APPLICATION_STATUSES } from "@/lib/constants";

export const APPLICATION_CREATE_KEYS = new Set([
  "company",
  "role",
  "job_url",
  "job_description",
  "status",
  "source",
  "board",
  "external_job_id",
  "location",
  "salary_range",
  "notes",
  "contact_name",
  "contact_email",
  "fit_score",
  "match_score",
  "fit_analysis",
  "generated_email",
  "next_action_at",
  "last_contacted_at",
  "resume_version_id",
  "display_order",
  "applied_date",
  "last_status_change_source",
  "last_status_change_reason",
  "last_status_change_at",
  "ai_metadata",
]);

export const APPLICATION_UPDATE_KEYS = new Set([
  "company",
  "role",
  "job_url",
  "job_description",
  "status",
  "source",
  "board",
  "external_job_id",
  "location",
  "salary_range",
  "notes",
  "contact_name",
  "contact_email",
  "fit_score",
  "match_score",
  "fit_analysis",
  "generated_email",
  "next_action_at",
  "last_contacted_at",
  "resume_version_id",
  "display_order",
  "applied_date",
  "last_status_change_source",
  "last_status_change_reason",
  "last_status_change_at",
  "ai_metadata",
  "id",
]);

const STATUS_CHANGE_SOURCES = ["manual", "gmail_auto", "gmail_confirmed", "system"] as const;
const APPLICATION_SOURCES = ["manual", "extension", "imported", "referral", "automation"] as const;

export const isValidStatusChangeSource = (
  value: unknown
): value is (typeof STATUS_CHANGE_SOURCES)[number] =>
  typeof value === "string" && (STATUS_CHANGE_SOURCES as readonly string[]).includes(value);

export const isValidApplicationSource = (
  value: unknown
): value is (typeof APPLICATION_SOURCES)[number] =>
  typeof value === "string" && (APPLICATION_SOURCES as readonly string[]).includes(value);

export const isValidStatus = (value: unknown): boolean =>
  typeof value === "string" && (APPLICATION_STATUSES as readonly string[]).includes(value);

const DB_STATUS_CANDIDATES: Record<Application["status"], string[]> = {
  saved: ["saved", "wishlist", "bookmarked", "draft"],
  applied: ["applied", "application_submitted", "submitted"],
  interview: [
    "interview",
    "interviewing",
    "onsite",
    "final_round",
    "final round",
    "phone_screen",
    "phone-screen",
    "phone screen",
    "screening",
    "phone",
  ],
  offer: ["offer", "offered", "accepted"],
  rejected: ["rejected", "declined", "no_offer", "no offer"],
};

const LEGACY_TO_CANONICAL: Record<string, Application["status"]> = Object.entries(
  DB_STATUS_CANDIDATES
).reduce((acc, [canonical, candidates]) => {
  for (const candidate of candidates) {
    const key = candidate.trim().toLowerCase().replace(/[\s-]+/g, "_");
    acc[key] = canonical as Application["status"];
  }
  return acc;
}, {} as Record<string, Application["status"]>);

export const normalizeStatus = (value: unknown): Application["status"] | null => {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return LEGACY_TO_CANONICAL[key] ?? null;
};

const legacyStatusCandidates = (status: Application["status"]): string[] =>
  DB_STATUS_CANDIDATES[status] ?? [status];

const toTitleCase = (value: string): string =>
  value
    .split(" ")
    .map((segment) =>
      segment.length ? segment[0].toUpperCase() + segment.slice(1).toLowerCase() : segment
    )
    .join(" ");

export const buildWriteStatusCandidates = (
  canonicalStatus: Application["status"],
  aliasCache: Map<string, Partial<Record<Application["status"], string>>>,
  userId?: string
): string[] => {
  const spaced = canonicalStatus.replace(/_/g, " ");
  const hyphenated = canonicalStatus.replace(/_/g, "-");
  const userAlias = userId ? aliasCache.get(userId)?.[canonicalStatus] : undefined;

  const candidates = [
    userAlias,
    canonicalStatus,
    spaced,
    hyphenated,
    toTitleCase(spaced),
    toTitleCase(hyphenated.replace(/-/g, " ")),
    spaced.toUpperCase(),
    hyphenated.toUpperCase(),
    ...legacyStatusCandidates(canonicalStatus),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return Array.from(new Set(candidates));
};

export const isStatusCheckConstraintError = (message: string): boolean =>
  message.toLowerCase().includes("applications_status_check");
