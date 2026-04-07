import type { NormalizedJob } from "./types";
import { hasEntryLevelRoleTypes } from "@/lib/services/career-os";

const USAJOBS_BASE = "https://data.usajobs.gov/api/Search";

const toIsoOrNull = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const fetchUsajobsJobs = async (input: {
  keywords: string[];
  locations: string[];
  roleTypes: string[];
}): Promise<NormalizedJob[]> => {
  const apiKey = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_EMAIL;
  if (!apiKey || !email) {
    throw new Error("USAJOBS credentials not configured");
  }

  const params = new URLSearchParams({
    Keyword: input.keywords.slice(0, 3).join(" ") || "intern OR student",
    ResultsPerPage: "50",
    Page: "1",
    WhoMayApply: "public",
  });

  if (input.locations[0]) {
    params.set("LocationName", input.locations[0]);
  }

  if (hasEntryLevelRoleTypes(input.roleTypes)) {
    params.set("HiringPath", "students");
  }

  const url = `${USAJOBS_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "Authorization-Key": apiKey,
      "User-Agent": email,
      Host: "data.usajobs.gov",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`USAJOBS HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    SearchResult?: {
      SearchResultItems?: Array<{
        MatchedObjectId?: string;
        MatchedObjectDescriptor?: {
          PositionTitle?: string;
          OrganizationName?: string;
          PositionLocationDisplay?: string;
          QualificationSummary?: string;
          PositionURI?: string;
          PublicationStartDate?: string;
          PositionRemuneration?: Array<{
            MinimumRange?: string;
            MaximumRange?: string;
            RateIntervalCode?: string;
          }>;
          UserArea?: {
            Details?: {
              MajorDuties?: string[];
              TeleworkEligible?: boolean;
            };
          };
        };
      }>;
    };
  };

  const items = data.SearchResult?.SearchResultItems ?? [];
  const out: NormalizedJob[] = [];

  for (const item of items) {
    const id = item.MatchedObjectId?.trim() ?? "";
    const descriptor = item.MatchedObjectDescriptor;
    const title = descriptor?.PositionTitle?.trim() ?? "";
    if (!id || !title) continue;

    const duties = Array.isArray(descriptor?.UserArea?.Details?.MajorDuties)
      ? descriptor?.UserArea?.Details?.MajorDuties.filter(Boolean).join(". ")
      : "";
    const desc = ((duties || descriptor?.QualificationSummary) ?? "")
      .replace(/<[^>]+>/g, " ")
      .slice(0, 8000);
    const remuneration = descriptor?.PositionRemuneration?.[0];
    let salary = "";
    if (remuneration?.MinimumRange && remuneration?.MaximumRange && remuneration?.RateIntervalCode) {
      salary = `${remuneration.MinimumRange}-${remuneration.MaximumRange} ${remuneration.RateIntervalCode}`;
    }

    const location = descriptor?.PositionLocationDisplay?.trim() ?? "";
    const teleworkEligible = Boolean(descriptor?.UserArea?.Details?.TeleworkEligible);

    out.push({
      title,
      company: (descriptor?.OrganizationName ?? "US Federal Government").trim() || "US Federal Government",
      location,
      description: desc,
      salary,
      job_url: descriptor?.PositionURI?.trim() ?? "",
      api_source: "usajobs",
      api_job_id: `usajobs-${id}`,
      is_remote: /\b(anywhere|remote|negotiable)\b/i.test(location) || teleworkEligible,
      posted_at: toIsoOrNull(descriptor?.PublicationStartDate),
    });
  }

  return out;
};
