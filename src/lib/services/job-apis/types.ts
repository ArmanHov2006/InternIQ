export type JobApiSource =
  | "adzuna"
  | "greenhouse"
  | "themuse"
  | "jsearch"
  | "himalayas"
  | "jobicy"
  | "remoteok"
  | "jooble"
  | "usajobs"
  | "searchapi";

export interface NormalizedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  job_url: string;
  api_source: JobApiSource;
  api_job_id: string;
  is_remote: boolean;
  posted_at: string | null;
}

export interface DiscoverySourceAvailability {
  enabled: boolean;
  keyed: boolean;
  paid: boolean;
  requiresEnv: string[];
  reason: string | null;
}

export type RemotePreference = "any" | "remote_only" | "hybrid" | "onsite";

export interface DiscoveryFetchInput {
  keywords: string[];
  locations: string[];
  sourceQueryLocations?: string[];
  remotePreference: RemotePreference;
  roleTypes: string[];
  excludedCompanies: string[];
  greenhouseSlugs: string[];
  adzunaMaxPages?: number;
  sourceTimeoutMs?: number;
}

export interface SourceFetchStat {
  count: number;
  durationMs: number;
  timedOut: boolean;
  error: string | null;
  limited?: boolean;
  note?: string | null;
}

export interface SourceFetchResult {
  source: JobApiSource;
  jobs: NormalizedJob[];
  durationMs: number;
  timedOut: boolean;
  error?: string;
  limited?: boolean;
  note?: string;
}

export interface DiscoveryFetchStageCounts {
  fetched: number;
  afterRemote: number;
  afterLocation: number;
  afterSeniority: number;
}

export interface DiscoveryFetchResult {
  jobs: NormalizedJob[];
  sourceErrors: Record<string, string>;
  sourceStats: Record<string, SourceFetchStat>;
  sourceAvailability: Record<JobApiSource, DiscoverySourceAvailability>;
  sourceQueryLocations: string[];
  stageCounts: DiscoveryFetchStageCounts;
}
