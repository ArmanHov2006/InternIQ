import type { NormalizedJob } from "./types";
import { hasEntryLevelRoleTypes } from "@/lib/services/career-os";

const ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs";

const inferCountry = (locations: string[]): string => {
  const joined = locations.join(" ").toLowerCase();
  if (/\buk\b|united kingdom|london|england|scotland/.test(joined)) return "gb";
  if (/\bca\b|canada|toronto|vancouver/.test(joined)) return "ca";
  if (/\bau\b|australia|sydney|melbourne/.test(joined)) return "au";
  return "us";
};

const buildWhat = (keywords: string[], roleTypes: string[], remoteQuery = false): string => {
  const skills = keywords.map((s) => s.trim()).filter(Boolean);
  const roles = roleTypes.map((s) => s.trim()).filter(Boolean);
  const qualifiers = remoteQuery ? ["remote"] : [];

  const skillPart = skills.slice(0, 3).join(" OR ");
  const rolePart = [...roles.slice(0, 2), ...qualifiers].join(" OR ");

  if (skillPart && rolePart) return `(${skillPart}) AND (${rolePart})`;
  if (skillPart) return skillPart;
  if (rolePart) return rolePart;
  return remoteQuery ? "remote AND (intern OR entry level OR junior)" : "intern OR entry level OR junior";
};

export const buildWhatExclude = (roleTypes: string[]): string =>
  hasEntryLevelRoleTypes(roleTypes)
    ? "senior sr staff principal lead director vp chief architect manager head"
    : "";

export const fetchAdzunaJobs = async (input: {
  keywords: string[];
  locations: string[];
  roleTypes: string[];
  maxPages: number;
  remoteQuery?: boolean;
  signal?: AbortSignal;
}): Promise<NormalizedJob[]> => {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("Adzuna credentials not configured");
  }

  const country = inferCountry(input.locations);
  const what = encodeURIComponent(buildWhat(input.keywords, input.roleTypes, input.remoteQuery));
  const whatExclude = buildWhatExclude(input.roleTypes);
  const locationParam =
    !input.remoteQuery && input.locations.length > 0
      ? `&where=${encodeURIComponent(input.locations.slice(0, 3).join(" "))}`
      : "";
  const excludeParam = whatExclude ? `&what_exclude=${encodeURIComponent(whatExclude)}` : "";

  const pages = Math.min(Math.max(1, input.maxPages), 4);
  const all: NormalizedJob[] = [];

  for (let page = 1; page <= pages; page += 1) {
    const url = `${ADZUNA_BASE}/${country}/search/${page}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=25&what=${what}${locationParam}${excludeParam}`;
    const res = await fetch(url, { next: { revalidate: 0 }, signal: input.signal });
    if (!res.ok) {
      throw new Error(`Adzuna HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      results?: Array<{
        id?: string | number;
        title?: string;
        company?: { display_name?: string };
        location?: { display_areas?: string[] };
        description?: string;
        salary_min?: number;
        salary_max?: number;
        redirect_url?: string;
        created?: string;
      }>;
    };

    for (const result of data.results ?? []) {
      const id = result.id != null ? String(result.id) : "";
      if (!id || !result.title) continue;

      const company = result.company?.display_name?.trim() || "Unknown";
      const location =
        Array.isArray(result.location?.display_areas) && result.location.display_areas.length > 0
          ? result.location.display_areas.join(", ")
          : "";
      const description = (result.description ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
      const salary =
        result.salary_min != null && result.salary_max != null
          ? `${result.salary_min}-${result.salary_max}`
          : "";

      all.push({
        title: result.title.trim(),
        company,
        location,
        description,
        salary,
        job_url: result.redirect_url?.trim() || "",
        api_source: "adzuna",
        api_job_id: `adzuna-${country}-${id}`,
        is_remote: /\bremote\b/i.test(`${result.title} ${description} ${location}`),
        posted_at: result.created ? new Date(result.created).toISOString() : null,
      });
    }
  }

  return all;
};
