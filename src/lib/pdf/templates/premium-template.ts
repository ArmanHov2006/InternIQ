import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PdfDocumentModel } from "@/lib/pdf/types";

type RenderOptions = {
  includeMetadata: boolean;
};

const PAGE = {
  width: 595.28, // A4 portrait
  height: 841.89,
  margin: 48,
};

const FONT_SIZES = {
  title: 20,
  subtitle: 11,
  sectionTitle: 13,
  body: 10.5,
  metadata: 9.5,
};

const COLORS = {
  title: rgb(0.12, 0.15, 0.24),
  subtitle: rgb(0.32, 0.35, 0.45),
  sectionTitle: rgb(0.22, 0.25, 0.38),
  body: rgb(0.14, 0.16, 0.2),
  muted: rgb(0.45, 0.47, 0.55),
  accent: rgb(0.35, 0.42, 0.76),
};

const sanitizeWinAnsi = (value: string): string =>
  value
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");

const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
  const words = sanitizeWinAnsi(text).replace(/\r/g, "").split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!word) continue;
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const lineHeight = (fontSize: number) => fontSize * 1.45;

const ensurePage = (
  pdf: PDFDocument,
  state: { page: PDFPage; y: number },
  requiredHeight: number
) => {
  if (state.y - requiredHeight >= PAGE.margin) return;
  state.page = pdf.addPage([PAGE.width, PAGE.height]);
  state.y = PAGE.height - PAGE.margin;
};

export const renderPremiumPdfTemplate = async (
  model: PdfDocumentModel,
  options: RenderOptions
): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const semibold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const state = {
    page: pdf.addPage([PAGE.width, PAGE.height]),
    y: PAGE.height - PAGE.margin,
  };
  const contentWidth = PAGE.width - PAGE.margin * 2;

  const title = sanitizeWinAnsi(model.title);
  const subtitle = sanitizeWinAnsi(model.subtitle ?? "");

  // Header
  state.page.drawText(title, {
    x: PAGE.margin,
    y: state.y,
    size: FONT_SIZES.title,
    font: semibold,
    color: COLORS.title,
  });
  state.y -= lineHeight(FONT_SIZES.title);

  if (subtitle.trim()) {
    const subtitleLines = wrapText(subtitle, regular, FONT_SIZES.subtitle, contentWidth);
    for (const line of subtitleLines) {
      ensurePage(pdf, state, lineHeight(FONT_SIZES.subtitle));
      state.page.drawText(line, {
        x: PAGE.margin,
        y: state.y,
        size: FONT_SIZES.subtitle,
        font: regular,
        color: COLORS.subtitle,
      });
      state.y -= lineHeight(FONT_SIZES.subtitle);
    }
    state.y -= 8;
  } else {
    state.y -= 6;
  }

  if (options.includeMetadata && model.metadata?.length) {
    const metadataText = model.metadata
      .map((item) => `${sanitizeWinAnsi(item.label)}: ${sanitizeWinAnsi(item.value)}`)
      .join(" | ");
    const metadataLines = wrapText(metadataText, regular, FONT_SIZES.metadata, contentWidth);
    for (const line of metadataLines) {
      ensurePage(pdf, state, lineHeight(FONT_SIZES.metadata));
      state.page.drawText(line, {
        x: PAGE.margin,
        y: state.y,
        size: FONT_SIZES.metadata,
        font: italic,
        color: COLORS.muted,
      });
      state.y -= lineHeight(FONT_SIZES.metadata);
    }
    state.y -= 8;
  }

  // Accent divider
  ensurePage(pdf, state, 12);
  state.page.drawLine({
    start: { x: PAGE.margin, y: state.y },
    end: { x: PAGE.width - PAGE.margin, y: state.y },
    thickness: 1.2,
    color: COLORS.accent,
  });
  state.y -= 16;

  for (const section of model.sections) {
    const sectionTitle = sanitizeWinAnsi(section.title);
    const sectionBody = sanitizeWinAnsi(section.body);
    const sectionTitleHeight = lineHeight(FONT_SIZES.sectionTitle);
    ensurePage(pdf, state, sectionTitleHeight + 8);
    state.page.drawText(sectionTitle, {
      x: PAGE.margin,
      y: state.y,
      size: FONT_SIZES.sectionTitle,
      font: semibold,
      color: COLORS.sectionTitle,
    });
    state.y -= sectionTitleHeight;

    const paragraphs = sectionBody.replace(/\r/g, "").split("\n");
    for (const paragraph of paragraphs) {
      const text = paragraph.trim();
      if (!text) {
        state.y -= 8;
        continue;
      }
      const lines = wrapText(text, regular, FONT_SIZES.body, contentWidth);
      for (const line of lines) {
        ensurePage(pdf, state, lineHeight(FONT_SIZES.body));
        state.page.drawText(line, {
          x: PAGE.margin,
          y: state.y,
          size: FONT_SIZES.body,
          font: regular,
          color: COLORS.body,
        });
        state.y -= lineHeight(FONT_SIZES.body);
      }
    }
    state.y -= 12;
  }

  return pdf.save();
};
