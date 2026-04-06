import type { NormalizedJob } from "./types";

const ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs";

const inferCountry = (locations: string[]): string => {
  const joined = locations.join(" ").toLowerCase();
  if (/\buk\b|united kingdom|london|england|scotland/.test(joined)) return "gb";
  if (/\bca\b|canada|toronto|vancouver/.test(joined)) return "ca";
  if (/\bau\b|australia|sydney|melbourne/.test(joined)) return "au";
  return "us";
};

const buildWhat = (keywords: string[], roleTypes: string[]): string => {
  const parts = [...keywords, ...roleTypes].map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts.slice(0, 5).join(" ") : "intern OR entry level OR junior";
};

export const fetchAdzunaJobs = async (input: {
  keywords: string[];
  locations: string[];
  roleTypes: string[];
  maxPages: number;
}): Promise<NormalizedJob[]> => {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("Adzuna credentials not configured");
  }

  const country = inferCountry(input.locations);
  const what = encodeURIComponent(buildWhat(input.keywords, input.roleTypes));
  const locationParam =
    input.locations.length > 0
      ? `&where=${encodeURIComponent(input.locations.slice(0, 3).join(" "))}`
      : "";

  const pages = Math.min(Math.max(1, input.maxPages), 2);
  const all: NormalizedJob[] = [];

  for (let page = 1; page <= pages; page += 1) {
    const url = `${ADZUNA_BASE}/${country}/search/${page}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=25&what=${what}${locationParam}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
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
        salary_is_predicted?: string;
        redirect_url?: string;
        created?: string;
      }>;
    };

    const batch = data.results ?? [];
    for (const r of batch) {
      const id = r.id != null ? String(r.id) : "";
      if (!id || !r.title) continue;
      const company = r.company?.display_name?.trim() || "Unknown";
      const loc =
        Array.isArray(r.location?.display_areas) && r.location.display_areas.length
          ? r.location.display_areas.join(", ")
          : "";
      const desc = (r.description ?? "").replace(/<[^>]+>/g, " ").slice(0, 8000);
      let salary = "";
      if (r.salary_min != null && r.salary_max != null) {
        salary = `${r.salary_min}–${r.salary_max}`;
      }
      const remote = /\bremote\b/i.test(`${r.title} ${desc} ${loc}`);
      all.push({
        title: r.title.trim(),
        company,
        location: loc,
        description: desc,
        salary,
        job_url: r.redirect_url?.trim() || "",
        api_source: "adzuna",
        api_job_id: `adzuna-${country}-${id}`,
        is_remote: remote,
        posted_at: r.created ? new Date(r.created).toISOString() : null,
      });
    }
  }

  return all;
};
