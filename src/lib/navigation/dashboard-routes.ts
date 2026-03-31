export const buildPipelinePath = (params: URLSearchParams, appId: string | null): string => {
  const next = new URLSearchParams(params.toString());
  if (appId) next.set("app", appId);
  else next.delete("app");
  const q = next.toString();
  return q ? `/dashboard/pipeline?${q}` : "/dashboard/pipeline";
};

export const getPipelineAppIdFromSearch = (params: URLSearchParams): string | null => {
  const raw = params.get("app");
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const getSettingsSectionFromSearch = (params: URLSearchParams): "profile" | "integrations" | null => {
  const section = params.get("section");
  if (section === "profile" || section === "integrations") return section;
  return null;
};

export const getGmailOauthToast = (
  params: URLSearchParams
): { type: "success" | "error"; message: string } | null => {
  if (params.get("connected") === "1") {
    return { type: "success", message: "Gmail connected." };
  }
  const error = params.get("error");
  if (!error) return null;
  return { type: "error", message: `Gmail: ${error.replace(/_/g, " ")}` };
};
