import type { DiscoverySourceAvailability, JobApiSource } from "./types";

type SourceRegistryEntry = {
  source: JobApiSource;
  keyed: boolean;
  paid: boolean;
  requiresEnv: string[];
};

const SOURCE_REGISTRY: SourceRegistryEntry[] = [
  { source: "adzuna", keyed: true, paid: true, requiresEnv: ["ADZUNA_APP_ID", "ADZUNA_APP_KEY"] },
  { source: "greenhouse", keyed: false, paid: false, requiresEnv: [] },
  { source: "themuse", keyed: true, paid: true, requiresEnv: ["THEMUSE_API_KEY"] },
  { source: "jsearch", keyed: true, paid: true, requiresEnv: ["JSEARCH_API_KEY"] },
  { source: "himalayas", keyed: false, paid: false, requiresEnv: [] },
  { source: "jobicy", keyed: false, paid: false, requiresEnv: [] },
  { source: "remoteok", keyed: false, paid: false, requiresEnv: [] },
  { source: "jooble", keyed: true, paid: true, requiresEnv: ["JOOBLE_API_KEY"] },
  { source: "usajobs", keyed: true, paid: false, requiresEnv: ["USAJOBS_API_KEY", "USAJOBS_EMAIL"] },
  { source: "searchapi", keyed: true, paid: true, requiresEnv: ["SEARCHAPI_API_KEY"] },
];

export const buildDiscoverySourceAvailability = (): Record<JobApiSource, DiscoverySourceAvailability> => {
  const availability = {} as Record<JobApiSource, DiscoverySourceAvailability>;

  for (const entry of SOURCE_REGISTRY) {
    const missing = entry.requiresEnv.filter((name) => !process.env[name]?.trim());
    availability[entry.source] = {
      enabled: missing.length === 0,
      keyed: entry.keyed,
      paid: entry.paid,
      requiresEnv: entry.requiresEnv,
      reason: missing.length > 0 ? `Missing ${missing.join(", ")}` : null,
    };
  }

  return availability;
};

export const isDiscoverySourceEnabled = (
  availability: Record<JobApiSource, DiscoverySourceAvailability>,
  source: JobApiSource
): boolean => availability[source]?.enabled ?? false;
