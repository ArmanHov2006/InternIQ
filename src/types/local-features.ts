export type AnalysisRecord = {
  id: string;
  createdAt: string;
  resumeFileName: string;
  resumeText: string;
  jobInput: string;
  fitScore: number;
  missingKeywords: string[];
  suggestions: string[];
  highlights: string[];
  matchedKeywords: string[];
  actionVerbCoverage: number;
};

export type LocalResumeDoc = {
  id: string;
  fileName: string;
  text: string;
  uploadedAt: string;
  isPrimary: boolean;
};

export type EmailTemplateId =
  | "networking_intro"
  | "application_followup"
  | "referral_request"
  | "informational_interview";

export type GeneratedEmailRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  templateId: EmailTemplateId;
  recipientName: string;
  company: string;
  role: string;
  sellingPoints: string;
  subject: string;
  body: string;
};

export type ProfileBasicInfo = {
  fullName: string;
  username: string;
  university: string;
  graduationYear: string;
  location: string;
  headline: string;
  bio: string;
  links: {
    website: string;
    github: string;
    linkedin: string;
    portfolio: string;
  };
};

export type ProfileSkillCategory = "language" | "framework" | "tool";

export type ProfileSkill = {
  id: string;
  name: string;
  category: ProfileSkillCategory;
};

export type ProfileProject = {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  link: string;
};

export type ProfileExperience = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  bullets: string[];
};
