import { createRequire } from "node:module";

type PdfParseResult = {
  text: string;
};

type PdfParseFn = (dataBuffer: Buffer) => Promise<PdfParseResult>;

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as PdfParseFn;

export async function extractTextFromPdfBytes(bytes: Uint8Array): Promise<string> {
  const parsed = await pdfParse(Buffer.from(bytes));
  return parsed.text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
