export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  applied: "bg-orange-400/10 text-orange-300 border-orange-400/20",
  interview: "bg-amber-300/10 text-amber-200 border-amber-300/20",
  offer: "bg-green-400/10 text-green-400 border-green-400/20",
  rejected: "bg-red-400/10 text-red-400 border-red-400/20",
};

export const SKILL_CATEGORIES = [
  "language",
  "framework",
  "tool",
  "other",
] as const;

export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  language: "Languages",
  framework: "Frameworks",
  tool: "Tools",
  other: "Other",
};
