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
  saved: "bg-blue-100 text-blue-800 border-blue-300",
  applied: "bg-indigo-100 text-indigo-800 border-indigo-300",
  interview: "bg-purple-100 text-purple-800 border-purple-300",
  offer: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
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
