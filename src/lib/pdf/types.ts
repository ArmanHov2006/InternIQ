export type PdfTemplateId = "premium-default";

export interface PdfSection {
  title: string;
  body: string;
}

export interface PdfDocumentModel {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  metadata?: Array<{ label: string; value: string }>;
}

export interface ExportPdfPayload {
  feature: "resume-tailor" | "analyze" | "cover-letter" | "email" | "interview-prep";
  template: PdfTemplateId;
  filename: string;
  includeMetadata: boolean;
  document: PdfDocumentModel;
}
