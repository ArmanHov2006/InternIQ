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
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
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
  last_status_change_source: "manual" | "gmail_auto" | "gmail_confirmed" | "system";
  last_status_change_reason: string;
  last_status_change_at: string;
  created_at: string;
  updated_at: string;
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
