import type { ExportPdfPayload, PdfDocumentModel } from "@/lib/pdf/types";

const MAX_SECTIONS = 80;
const MAX_SECTION_BODY = 20_000;
const MAX_TITLE_LENGTH = 180;
const MAX_TOTAL_CHARS = 180_000;

const isString = (value: unknown): value is string => typeof value === "string";

const validateDocument = (document: unknown): document is PdfDocumentModel => {
  if (!document || typeof document !== "object") return false;
  const candidate = document as PdfDocumentModel;
  if (!isString(candidate.title) || candidate.title.length === 0 || candidate.title.length > MAX_TITLE_LENGTH) {
    return false;
  }
  if (candidate.subtitle && (!isString(candidate.subtitle) || candidate.subtitle.length > 2000)) {
    return false;
  }
  if (!Array.isArray(candidate.sections) || candidate.sections.length === 0 || candidate.sections.length > MAX_SECTIONS) {
    return false;
  }
  let totalChars = candidate.title.length + (candidate.subtitle?.length ?? 0);
  for (const section of candidate.sections) {
    if (!section || typeof section !== "object") return false;
    if (!isString(section.title) || section.title.length === 0 || section.title.length > MAX_TITLE_LENGTH) {
      return false;
    }
    if (!isString(section.body) || section.body.length > MAX_SECTION_BODY) {
      return false;
    }
    totalChars += section.title.length + section.body.length;
  }
  if (candidate.metadata) {
    if (!Array.isArray(candidate.metadata)) return false;
    for (const meta of candidate.metadata) {
      if (!meta || typeof meta !== "object") return false;
      if (!isString(meta.label) || !isString(meta.value)) return false;
      totalChars += meta.label.length + meta.value.length;
    }
  }
  return totalChars <= MAX_TOTAL_CHARS;
};

export const validateExportPayload = (
  payload: unknown
): { valid: true; payload: ExportPdfPayload } | { valid: false; error: string } => {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Invalid JSON payload." };
  }
  const candidate = payload as Partial<ExportPdfPayload>;
  const featureAllowed = [
    "resume-tailor",
    "analyze",
    "cover-letter",
    "email",
    "interview-prep",
  ].includes(String(candidate.feature));
  if (!featureAllowed) {
    return { valid: false, error: "Invalid export feature." };
  }
  if (candidate.template !== "premium-default") {
    return { valid: false, error: "Invalid PDF template." };
  }
  if (!isString(candidate.filename) || candidate.filename.trim().length < 3 || candidate.filename.length > 120) {
    return { valid: false, error: "Invalid filename." };
  }
  if (typeof candidate.includeMetadata !== "boolean") {
    return { valid: false, error: "includeMetadata must be a boolean." };
  }
  if (!validateDocument(candidate.document)) {
    return { valid: false, error: "Invalid document structure for PDF export." };
  }
  return { valid: true, payload: candidate as ExportPdfPayload };
};
