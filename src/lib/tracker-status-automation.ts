import { normalizeStoredApplicationStatus, type ApplicationStatus } from "@/lib/constants";
import type { Application } from "@/types/database";

export type EmailIngestMessage = {
  sender: string;
  subject: string;
  body?: string;
  received_at?: string;
};

export type StatusClassification = {
  status: ApplicationStatus;
  confidence: number;
  evidence: string;
};

const RULES: Array<{ status: ApplicationStatus; score: number; terms: string[] }> = [
  { status: "offer", score: 0.96, terms: ["offer", "congratulations", "we are excited to extend"] },
  { status: "rejected", score: 0.95, terms: ["unfortunately", "not moving forward", "rejection"] },
  { status: "withdrawn", score: 0.9, terms: ["withdrawn", "withdrew", "remove my application"] },
  { status: "final_round", score: 0.84, terms: ["final round", "onsite", "panel interview"] },
  { status: "take_home", score: 0.82, terms: ["take-home", "assignment", "coding challenge"] },
  { status: "hiring_manager", score: 0.78, terms: ["hiring manager", "manager interview"] },
  { status: "recruiter_screen", score: 0.72, terms: ["recruiter screen", "phone screen", "intro call"] },
  { status: "applied", score: 0.68, terms: ["application received", "thank you for applying"] },
];

export const classifyEmailStatus = (message: EmailIngestMessage): StatusClassification | null => {
  const text = `${message.subject ?? ""}\n${message.body ?? ""}`.toLowerCase();

  for (const rule of RULES) {
    const matched = rule.terms.find((term) => text.includes(term));
    if (matched) {
      return {
        status: rule.status,
        confidence: rule.score,
        evidence: `${message.sender} • matched "${matched}"`,
      };
    }
  }

  return null;
};

export const confidenceMode = (confidence: number): "auto" | "suggested" | "ignore" => {
  if (confidence >= 0.78) return "auto";
  if (confidence >= 0.55) return "suggested";
  return "ignore";
};

export const scoreApplicationMatch = (application: Application, message: EmailIngestMessage): number => {
  const subject = (message.subject ?? "").toLowerCase();
  const body = (message.body ?? "").toLowerCase();
  const sender = (message.sender ?? "").toLowerCase();
  const company = (application.company ?? "").toLowerCase();
  const role = (application.role ?? "").toLowerCase();
  const contactEmail = (application.contact_email ?? "").toLowerCase();

  let score = 0;
  if (company && (subject.includes(company) || body.includes(company))) score += 0.45;
  if (role && (subject.includes(role) || body.includes(role))) score += 0.3;
  if (contactEmail && sender.includes(contactEmail)) score += 0.55;
  if (company && sender.includes(company.replace(/\s+/g, ""))) score += 0.25;

  return Math.min(1, score);
};

export const pickBestApplicationMatch = (
  applications: Application[],
  message: EmailIngestMessage
): { application: Application; score: number } | null => {
  const ranked = applications
    .map((application) => ({
      application,
      score: scoreApplicationMatch(application, message),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 0.45) return null;
  return best;
};

export const safePrevStatus = (value: unknown): ApplicationStatus => {
  return normalizeStoredApplicationStatus(value);
};
