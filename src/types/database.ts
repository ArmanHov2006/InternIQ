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
  status:
    | "saved"
    | "applied"
    | "recruiter_screen"
    | "hiring_manager"
    | "final_round"
    | "take_home"
    | "offer"
    | "rejected"
    | "withdrawn";
  applied_date: string;
  salary_range: string;
  location: string;
  notes: string;
  fit_score: number | null;
  fit_analysis: string;
  contact_name: string;
  contact_email: string;
  generated_email: string;
  display_order: number;
  status_source: "manual" | "email_auto" | "email_suggested";
  status_confidence: number;
  status_evidence: string;
  previous_status: string;
  auto_updated_at: string | null;
  suggestion_pending: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStatusEvent {
  id: string;
  application_id: string;
  user_id: string;
  previous_status: string;
  next_status: string;
  source: "manual" | "email_auto" | "email_suggested" | "undo";
  confidence: number;
  evidence: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  parsed_text: string;
  is_primary: boolean;
  created_at: string;
}
