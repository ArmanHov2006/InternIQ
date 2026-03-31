const SCHEMA_MISS_SNIPPETS = [
  "schema cache",
  "could not find the table",
  "could not find the '",
  "relation",
  "does not exist",
  "column",
];

const SCHEMA_MISS_CODES = new Set(["PGRST204", "PGRST205", "42P01", "42703"]);

type ErrorLike =
  | string
  | {
      message?: string | null;
      code?: string | null;
      details?: string | null;
      hint?: string | null;
    }
  | null
  | undefined;

const stringifyError = (error: ErrorLike): string => {
  if (!error) return "";
  if (typeof error === "string") return error;
  return [error.message, error.details, error.hint].filter(Boolean).join(" ").toLowerCase();
};

export const isSchemaCompatError = (error: ErrorLike): boolean => {
  if (!error) return false;
  if (typeof error !== "string" && error.code && SCHEMA_MISS_CODES.has(error.code)) {
    return true;
  }
  const combined = stringifyError(error);
  return SCHEMA_MISS_SNIPPETS.some((snippet) => combined.includes(snippet));
};

const LEGACY_APPLICATION_KEYS = new Set([
  "company",
  "role",
  "job_url",
  "status",
  "location",
  "salary_range",
  "notes",
  "contact_name",
  "contact_email",
  "fit_score",
  "fit_analysis",
  "generated_email",
  "display_order",
  "applied_date",
  "last_status_change_source",
  "last_status_change_reason",
  "last_status_change_at",
  "ai_metadata",
  "user_id",
  "id",
]);

export const stripApplicationV4Fields = (
  payload: Record<string, unknown>
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => LEGACY_APPLICATION_KEYS.has(key) && value !== undefined)
  );
