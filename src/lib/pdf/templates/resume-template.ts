import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PdfDocumentModel } from "@/lib/pdf/types";

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 48,
};

const FONT = {
  name: 20,
  contact: 10.5,
  heading: 11,
  body: 10.5,
};

const COLOR = {
  name: rgb(0.1, 0.1, 0.14),
  text: rgb(0.15, 0.16, 0.2),
  muted: rgb(0.35, 0.36, 0.42),
  divider: rgb(0.72, 0.74, 0.8),
};

const sanitize = (value: string): string =>
  value
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2014|\u2013/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");

const isHeadingLine = (line: string): boolean =>
  /^[A-Z][A-Z &/]{2,}$/.test(line.trim()) && line.trim().length <= 36;

const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
  const words = sanitize(text).replace(/\r/g, "").split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!word) continue;
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const ensurePage = (
  pdf: PDFDocument,
  state: { page: PDFPage; y: number },
  requiredHeight: number
) => {
  if (state.y - requiredHeight >= PAGE.margin) return;
  state.page = pdf.addPage([PAGE.width, PAGE.height]);
  state.y = PAGE.height - PAGE.margin;
};

export const renderResumePdfTemplate = async (model: PdfDocumentModel): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const state = {
    page: pdf.addPage([PAGE.width, PAGE.height]),
    y: PAGE.height - PAGE.margin,
  };
  const contentWidth = PAGE.width - PAGE.margin * 2;

  const raw = sanitize(model.sections?.[0]?.body ?? "");
  const lines = raw.split("\n").map((line) => line.trimEnd());
  const nonEmpty = lines.filter((line) => line.trim().length > 0);
  const name = nonEmpty[0] ?? "";
  const contact = nonEmpty[1] ?? "";
  const bodyStartIndex = lines.findIndex((line) => line.trim() === contact) + 1;
  const bodyLines = lines.slice(Math.max(bodyStartIndex, 0));

  // Name
  const nameWidth = bold.widthOfTextAtSize(name, FONT.name);
  state.page.drawText(name, {
    x: Math.max(PAGE.margin, (PAGE.width - nameWidth) / 2),
    y: state.y,
    size: FONT.name,
    font: bold,
    color: COLOR.name,
  });
  state.y -= FONT.name * 1.5;

  // Contact line
  const contactWidth = regular.widthOfTextAtSize(contact, FONT.contact);
  state.page.drawText(contact, {
    x: Math.max(PAGE.margin, (PAGE.width - contactWidth) / 2),
    y: state.y,
    size: FONT.contact,
    font: regular,
    color: COLOR.muted,
  });
  state.y -= FONT.contact * 1.7;

  state.page.drawLine({
    start: { x: PAGE.margin, y: state.y },
    end: { x: PAGE.width - PAGE.margin, y: state.y },
    thickness: 1,
    color: COLOR.divider,
  });
  state.y -= 12;

  for (const line of bodyLines) {
    const clean = line.trim();
    if (!clean) {
      state.y -= 5;
      continue;
    }

    if (isHeadingLine(clean)) {
      ensurePage(pdf, state, 24);
      state.y -= 2;
      state.page.drawText(clean, {
        x: PAGE.margin,
        y: state.y,
        size: FONT.heading,
        font: bold,
        color: COLOR.name,
      });
      state.y -= FONT.heading * 1.15;
      state.page.drawLine({
        start: { x: PAGE.margin, y: state.y },
        end: { x: PAGE.width - PAGE.margin, y: state.y },
        thickness: 0.8,
        color: COLOR.divider,
      });
      state.y -= 8;
      continue;
    }

    const isBullet = /^[-*]\s+/.test(clean);
    const bulletText = isBullet ? clean.replace(/^[-*]\s+/, "") : clean;
    const textLines = wrapText(
      bulletText,
      regular,
      FONT.body,
      isBullet ? contentWidth - 16 : contentWidth
    );

    for (let i = 0; i < textLines.length; i += 1) {
      ensurePage(pdf, state, FONT.body * 1.5);
      const x = PAGE.margin + (isBullet ? 12 : 0);
      state.page.drawText(textLines[i], {
        x,
        y: state.y,
        size: FONT.body,
        font: regular,
        color: COLOR.text,
      });
      if (isBullet && i === 0) {
        state.page.drawText("•", {
          x: PAGE.margin,
          y: state.y,
          size: FONT.body,
          font: regular,
          color: COLOR.text,
        });
      }
      state.y -= FONT.body * 1.45;
    }
  }

  return pdf.save();
};
