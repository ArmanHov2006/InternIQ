export type JobApiSource = "adzuna" | "remotive" | "greenhouse" | "themuse" | "jsearch" | "himalayas";

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

export type RemotePreference = "any" | "remote_only" | "hybrid" | "onsite";

export interface DiscoveryFetchInput {
  keywords: string[];
  locations: string[];
  remotePreference: RemotePreference;
  roleTypes: string[];
  excludedCompanies: string[];
  greenhouseSlugs: string[];
  adzunaMaxPages?: number;
}

export interface SourceFetchResult {
  source: JobApiSource;
  jobs: NormalizedJob[];
  error?: string;
}
