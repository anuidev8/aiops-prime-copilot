import { PDFDocument, StandardFonts, type PDFFont, rgb } from "pdf-lib";
import type { ReportCanvasBlock, ReportCanvasDocument } from "../types/report-canvas";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TITLE_SIZE = 13;
const BODY_SIZE = 10;
const LINE_HEIGHT = 14;
const BLOCK_GAP = 20;

function wrapLines(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${current} ${words[index]}`;
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
        lines.push(current);
        current = words[index];
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}

function chartBodyLines(block: Extract<ReportCanvasBlock, { type: "chart" }>, font: PDFFont): string[] {
  const lines = [
    ...wrapLines(`${block.metricName}: ${block.value}${block.unit}`, CONTENT_WIDTH, font, BODY_SIZE),
    ...wrapLines(`Trend: ${block.trend}`, CONTENT_WIDTH, font, BODY_SIZE),
  ];
  if (block.note.trim()) {
    lines.push(...wrapLines(`Note: ${block.note}`, CONTENT_WIDTH, font, BODY_SIZE));
  }
  if (block.visual?.series?.length) {
    lines.push(...wrapLines(`Chart (${block.visual.kind})`, CONTENT_WIDTH, font, BODY_SIZE));
    for (const point of block.visual.series.slice(0, 12)) {
      const secondary =
        typeof point.secondaryValue === "number"
          ? ` · secondary ${point.secondaryValue}`
          : "";
      lines.push(
        ...wrapLines(`• ${point.label}: ${point.value}${secondary}`, CONTENT_WIDTH, font, BODY_SIZE),
      );
    }
  }
  return lines;
}

export function sanitizePdfFilename(filename: string): string {
  const cleaned = filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
  const fallback = cleaned.length > 0 ? cleaned : "aiops-prime-report.pdf";
  return fallback.toLowerCase().endsWith(".pdf") ? fallback : `${fallback}.pdf`;
}

export async function renderCanvasPdf(document: ReportCanvasDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPageIfNeeded = (requiredHeight: number) => {
    if (y - requiredHeight < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  const drawLine = (
    text: string,
    options: { font: PDFFont; size: number; color?: ReturnType<typeof rgb> },
  ) => {
    newPageIfNeeded(LINE_HEIGHT);
    page.drawText(text, {
      x: MARGIN,
      y: y - options.size,
      size: options.size,
      font: options.font,
      color: options.color ?? rgb(0.15, 0.17, 0.22),
      maxWidth: CONTENT_WIDTH,
    });
    y -= LINE_HEIGHT;
  };

  page.drawText("AIOps Prime Report", {
    x: MARGIN,
    y: y - 18,
    size: 18,
    font: bold,
    color: rgb(0.08, 0.1, 0.14),
  });
  y -= 28;

  drawLine(`Generated: ${document.generatedAt}`, { font: regular, size: BODY_SIZE });
  drawLine(`Project: ${document.sourceProjectName ?? "All projects"}`, {
    font: regular,
    size: BODY_SIZE,
  });
  y -= BLOCK_GAP / 2;

  for (const block of document.blocks) {
    const titleLines = wrapLines(block.title, CONTENT_WIDTH, bold, TITLE_SIZE);
    const bodyLines =
      block.type === "text"
        ? wrapLines(block.content.trim(), CONTENT_WIDTH, regular, BODY_SIZE)
        : chartBodyLines(block, regular);

    const blockHeight =
      titleLines.length * LINE_HEIGHT + bodyLines.length * LINE_HEIGHT + BLOCK_GAP;
    newPageIfNeeded(blockHeight);

    for (const titleLine of titleLines) {
      newPageIfNeeded(LINE_HEIGHT);
      page.drawText(titleLine, {
        x: MARGIN,
        y: y - TITLE_SIZE,
        size: TITLE_SIZE,
        font: bold,
        color: rgb(0.1, 0.12, 0.18),
        maxWidth: CONTENT_WIDTH,
      });
      y -= LINE_HEIGHT;
    }

    for (const line of bodyLines) {
      drawLine(line, { font: regular, size: BODY_SIZE, color: rgb(0.2, 0.24, 0.3) });
    }

    y -= BLOCK_GAP;
  }

  return pdf.save();
}
