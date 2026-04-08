export interface Profile {
  id: string;
  username: string;
  full_name: string;
  headline: string;
  bio: string;
  avatar_url: string;
  resume_url: string;
  website_url: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
  location: string;
  is_open_to_work: boolean;
  created_at: string;
  updated_at: string;
}

export interface Education {
  id: string;
  user_id: string;
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string | null;
  end_date: string | null;
  gpa: string;
  description: string;
  display_order: number;
  created_at: string;
}

export interface Experience {
  id: string;
  user_id: string;
  company: string;
  title: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  is_internship: boolean;
  display_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  tech_stack: string[];
  live_url: string;
  github_url: string;
  image_url: string;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  created_at: string;
}

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  category: string;
  display_order: number;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  job_url: string;
  job_description?: string | null;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  source?: "manual" | "extension" | "imported" | "referral" | "automation";
  board?: string | null;
  external_job_id?: string | null;
  applied_date: string;
  salary_range: string;
  location: string;
  notes: string;
  fit_score: number | null;
  match_score?: number | null;
  fit_analysis: string;
  contact_name: string;
  contact_email: string;
  generated_email: string;
  next_action_at?: string | null;
  last_contacted_at?: string | null;
  resume_version_id?: string | null;
  display_order: number;
  last_status_change_source: "manual" | "gmail_auto" | "gmail_confirmed" | "system";
  last_status_change_reason: string;
  last_status_change_at: string;
  created_at: string;
  updated_at: string;
  ai_metadata?: Record<string, unknown> | null;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string | null;
  source_type: "upload" | "manual";
  storage_path?: string | null;
  parsed_text: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string;
  board: string;
  source: "manual" | "extension" | "imported" | "recommendation";
  job_url: string;
  external_job_id: string | null;
  salary_range: string;
  status: "new" | "saved" | "applied" | "archived";
  employment_type: string;
  job_description: string;
  match_score: number | null;
  match_summary: string;
  matched_keywords: string[];
  missing_keywords: string[];
  application_id: string | null;
  created_at: string;
  updated_at: string;
  api_source?: string | null;
  api_job_id?: string | null;
  discovery_run_id?: string | null;
  ai_score?: Record<string, unknown> | null;
  posted_at?: string | null;
  discovery_last_seen_at?: string | null;
  discovery_missed_runs?: number;
  discovery_is_stale?: boolean;
}

export type RemotePreference = "any" | "remote_only" | "hybrid" | "onsite";

export type DiscoveryRunReasonCode =
  | "success"
  | "no_source_results"
  | "location_filtered_out"
  | "seniority_filtered_out"
  | "score_threshold_filtered_out"
  | "all_refreshed"
  | "source_errors";

export interface DiscoverySourceStat {
  count: number;
  durationMs: number;
  timedOut: boolean;
  error: string | null;
  limited?: boolean;
  note?: string | null;
}

export interface DiscoverySourceAvailability {
  enabled: boolean;
  keyed: boolean;
  paid: boolean;
  requiresEnv: string[];
  reason: string | null;
}

export interface DiscoveryRunDiagnostics {
  reasonCode: DiscoveryRunReasonCode;
  secondaryIssues: DiscoveryRunReasonCode[];
  effectiveContext: {
    locations: string[];
    remote_preference: RemotePreference;
    role_types: string[];
  };
  executedContext: {
    keywords: string[];
    locations: string[];
    source_query_locations: string[];
    role_types: string[];
    remote_preference: RemotePreference;
  };
  stageCounts: {
    fetched: number;
    afterRemote: number;
    afterLocation: number;
    afterSeniority: number;
    afterThreshold: number;
    active: number;
    inserted: number;
    updated: number;
    reactivated: number;
  };
  sourceStats: Record<string, DiscoverySourceStat>;
  sourceAvailability?: Record<string, DiscoverySourceAvailability>;
}

export interface DiscoveryResumeContextOverrides {
  skills: string[];
  locations: string[];
  role_types: string[];
  note: string;
}

export interface DiscoveryResumeContextPreview {
  has_resume: boolean;
  detected_skills: string[];
  detected_locations: string[];
  detected_role_types: string[];
  effective_skills: string[];
  effective_locations: string[];
  effective_role_types: string[];
  summary: string;
}

export interface DiscoveryPreferences {
  user_id: string;
  keywords: string[];
  locations: string[];
  remote_preference: RemotePreference;
  role_types: string[];
  excluded_companies: string[];
  greenhouse_slugs: string[];
  min_match_score: number;
  resume_context_enabled: boolean;
  resume_context_customized: boolean;
  resume_context_overrides: DiscoveryResumeContextOverrides;
  resume_context_preview?: DiscoveryResumeContextPreview;
  is_active: boolean;
  last_discovery_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryRun {
  id: string;
  user_id: string;
  api_source: "adzuna" | "themuse" | "remotive" | "greenhouse" | "aggregate";
  query_params: Record<string, unknown>;
  results_count: number;
  new_opportunities_count: number;
  ai_scored_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  label: string;
  query: string;
  location: string;
  boards: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchInsight {
  score: number;
  summary: string;
  matched_keywords: string[];
  missing_keywords: string[];
  gating_flags?: string[];
}

export interface ApplicationContact {
  id: string;
  user_id: string;
  application_id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  relationship_type: "recruiter" | "referrer" | "hiring_manager" | "interviewer" | "other";
  notes: string;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationConversation {
  id: string;
  user_id: string;
  application_id: string;
  contact_id: string | null;
  channel: "email" | "linkedin" | "phone" | "meeting" | "other";
  summary: string;
  direction: "inbound" | "outbound" | "internal";
  occurred_at: string;
  created_at: string;
}

export interface ApplicationReminder {
  id: string;
  user_id: string;
  application_id: string;
  title: string;
  due_at: string;
  status: "pending" | "done" | "dismissed";
  created_at: string;
  updated_at: string;
}

export interface InterviewEvent {
  id: string;
  user_id: string;
  application_id: string;
  title: string;
  interview_type: "screen" | "behavioral" | "technical" | "onsite" | "final" | "other";
  scheduled_at: string;
  location: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeVersion {
  id: string;
  user_id: string;
  application_id: string;
  resume_id: string | null;
  label: string;
  summary: string;
  keyword_coverage: number | null;
  targeted_keywords: string[];
  created_at: string;
}

export interface ApplicationArtifact {
  id: string;
  user_id: string;
  application_id: string;
  artifact_type: "proof_pack" | "recruiter_note" | "story_bank" | "company_brief" | "resume_version";
  title: string;
  content: string;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationTimelineEvent {
  id: string;
  user_id: string;
  application_id: string;
  event_type: "status_change" | "contact" | "interview" | "artifact" | "note" | "system";
  title: string;
  description: string;
  occurred_at: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface ApplicationStatusSuggestion {
  id: string;
  user_id: string;
  application_id: string;
  email_event_id: string;
  from_status: string;
  to_status: string;
  confidence: number;
  reason: string;
  status: "pending" | "accepted" | "rejected";
  acted_at: string | null;
  acted_by_source: string | null;
  created_at: string;
}

export interface EmailEvent {
  id: string;
  user_id: string;
  from_email: string;
  subject: string;
  snippet: string;
  received_at: string;
  created_at: string;
}
