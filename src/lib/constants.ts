export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "recruiter_screen",
  "hiring_manager",
  "final_round",
  "take_home",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const APPLICATION_STATUS_SET = new Set<string>(APPLICATION_STATUSES);

export const LEGACY_APPLICATION_STATUS_ALIASES: Record<string, ApplicationStatus> = {
  phone_screen: "recruiter_screen",
  interview: "hiring_manager",
};

export const INTERVIEW_STAGE_STATUSES: ApplicationStatus[] = [
  "recruiter_screen",
  "hiring_manager",
  "final_round",
  "take_home",
];

export const STATUS_CHART_COLORS: Record<ApplicationStatus, string> = {
  saved: "#60a5fa",
  applied: "#818cf8",
  recruiter_screen: "#38bdf8",
  hiring_manager: "#a78bfa",
  final_round: "#c084fc",
  take_home: "#f59e0b",
  offer: "#34d399",
  rejected: "#f87171",
  withdrawn: "#94a3b8",
};

export const STATUS_GRADIENTS: Record<ApplicationStatus, string> = {
  saved: "from-blue-400 to-blue-500",
  applied: "from-indigo-400 to-indigo-500",
  recruiter_screen: "from-cyan-400 to-cyan-500",
  hiring_manager: "from-violet-400 to-violet-500",
  final_round: "from-fuchsia-400 to-fuchsia-500",
  take_home: "from-amber-400 to-orange-500",
  offer: "from-emerald-400 to-emerald-500",
  rejected: "from-rose-400 to-red-500",
  withdrawn: "from-slate-400 to-slate-500",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  recruiter_screen: "Recruiter Screen",
  hiring_manager: "Hiring Manager",
  final_round: "Final Round",
  take_home: "Take Home",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-blue-100 text-blue-800 border-blue-300",
  applied: "bg-indigo-100 text-indigo-800 border-indigo-300",
  recruiter_screen: "bg-cyan-100 text-cyan-800 border-cyan-300",
  hiring_manager: "bg-violet-100 text-violet-800 border-violet-300",
  final_round: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
  take_home: "bg-amber-100 text-amber-800 border-amber-300",
  offer: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  withdrawn: "bg-slate-100 text-slate-800 border-slate-300",
};

export const resolveApplicationStatus = (value: unknown): ApplicationStatus | null => {
  if (typeof value !== "string") return null;
  const normalized = LEGACY_APPLICATION_STATUS_ALIASES[value] ?? value;
  return APPLICATION_STATUS_SET.has(normalized) ? (normalized as ApplicationStatus) : null;
};

export const normalizeStoredApplicationStatus = (value: unknown): ApplicationStatus => {
  return resolveApplicationStatus(value) ?? "saved";
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

export const LANDING_SPLINE_SCENE_URL =
  "https://prod.spline.design/olDED5M9bNNJVADs/scene.splinecode";
