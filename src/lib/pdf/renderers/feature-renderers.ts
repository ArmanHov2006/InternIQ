import type { PdfDocumentModel } from "@/lib/pdf/types";

const nowLabel = () => new Date().toLocaleString();

export const buildResumeTailorDocument = (input: {
  editedResume: string;
  appliedChanges: string[];
}): PdfDocumentModel => ({
  title: "Fixed Resume",
  subtitle: "Selected edits applied.",
  metadata: [
    { label: "Generated", value: nowLabel() },
    { label: "Applied Changes", value: String(input.appliedChanges.length) },
  ],
  sections: [{ title: "Resume", body: input.editedResume }],
});

export const buildAnalyzeDocument = (input: {
  fitScore: number;
  jobUrl: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
}): PdfDocumentModel => ({
  title: "Resume Analyzer Report",
  subtitle: "AI fit analysis for the role.",
  metadata: [
    { label: "Generated", value: nowLabel() },
    { label: "Fit Score", value: `${input.fitScore}/100` },
    { label: "Job URL", value: input.jobUrl || "Not provided" },
  ],
  sections: [
    { title: "Summary", body: input.summary },
    { title: "Strengths", body: input.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n") || "None" },
    { title: "Gaps", body: input.gaps.map((s, i) => `${i + 1}. ${s}`).join("\n") || "None" },
    {
      title: "Recommendations",
      body: input.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n") || "None",
    },
  ],
});

export const buildCoverLetterDocument = (input: {
  title: string;
  content: string;
  company: string;
  role: string;
  tone: string;
}): PdfDocumentModel => ({
  title: "AI Cover Letter",
  subtitle: input.title,
  metadata: [
    { label: "Generated", value: nowLabel() },
    { label: "Company", value: input.company || "N/A" },
    { label: "Role", value: input.role || "N/A" },
    { label: "Tone", value: input.tone || "professional" },
  ],
  sections: [{ title: "Cover Letter", body: input.content }],
});

export const buildEmailDocument = (input: {
  subject: string;
  body: string;
  company: string;
  role: string;
  contactName: string;
  tone: string;
  jobUrl: string;
}): PdfDocumentModel => ({
  title: "Cold Outreach Email Draft",
  subtitle: "AI-generated outreach draft.",
  metadata: [
    { label: "Generated", value: nowLabel() },
    { label: "Company", value: input.company || "N/A" },
    { label: "Role", value: input.role || "N/A" },
    { label: "Contact", value: input.contactName || "Not specified" },
    { label: "Tone", value: input.tone || "professional" },
    { label: "Job URL", value: input.jobUrl || "Not provided" },
  ],
  sections: [
    { title: "Subject", body: input.subject },
    { title: "Email Body", body: input.body },
  ],
});

export const buildInterviewPrepDocument = (input: {
  jobUrl: string;
  questions: Array<{ category: string; question: string; answer_framework: string }>;
}): PdfDocumentModel => ({
  title: "Interview Prep Kit",
  subtitle: "Practice prompts and answer frameworks.",
  metadata: [
    { label: "Generated", value: nowLabel() },
    { label: "Job URL", value: input.jobUrl || "Not provided" },
    { label: "Question Count", value: String(input.questions.length) },
  ],
  sections: input.questions.map((q, idx) => ({
    title: `${idx + 1}. ${q.category}`,
    body: `Question: ${q.question}\n\nSuggested Framework:\n${q.answer_framework}`,
  })),
});
