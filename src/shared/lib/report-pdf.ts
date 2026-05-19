import { ReportCanvasBlock, ReportCanvasDocument } from "../types/report-canvas";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const PAGE_MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const HEADER_HEIGHT = 62;
const BLOCK_PADDING = 10;
const BLOCK_GAP = 12;
const TITLE_LINE_HEIGHT = 16;
const BODY_LINE_HEIGHT = 13;
const MAX_BODY_LINES_PER_BLOCK = Math.max(
  1,
  Math.floor(
    (PAGE_HEIGHT - PAGE_MARGIN * 2 - HEADER_HEIGHT - BLOCK_PADDING * 2 - TITLE_LINE_HEIGHT) /
      BODY_LINE_HEIGHT,
  ),
);

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value: string, maxChars = 88): string[] {
  const lines: string[] = [];

  for (const paragraph of value.split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${current} ${words[index]}`;
      if (candidate.length > maxChars) {
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

function toBodyLines(block: ReportCanvasBlock): string[] {
  if (block.type === "text") {
    return wrapText(block.content);
  }

  const lines = [
    ...wrapText(`${block.metricName}: ${block.value}${block.unit}`),
    ...wrapText(`Trend: ${block.trend}`),
    ...wrapText(`Note: ${block.note}`),
  ];

  if (block.visual?.series?.length) {
    lines.push(...wrapText(`Visual: ${block.visual.kind}`));
    for (const seriesPoint of block.visual.series.slice(0, 10)) {
      const secondary =
        typeof seriesPoint.secondaryValue === "number"
          ? ` (secondary ${seriesPoint.secondaryValue})`
          : "";
      lines.push(...wrapText(`- ${seriesPoint.label}: ${seriesPoint.value}${secondary}`));
    }
  }

  return lines;
}

function chunkLines(lines: string[], size: number): string[][] {
  if (lines.length === 0) return [[]];
  const chunks: string[][] = [];
  for (let index = 0; index < lines.length; index += size) {
    chunks.push(lines.slice(index, index + size));
  }
  return chunks;
}

function pushText(
  commands: string[],
  text: string,
  x: number,
  y: number,
  fontSize: number,
) {
  commands.push("BT");
  commands.push(`/F1 ${fontSize} Tf`);
  commands.push(`${x} ${y} Td`);
  commands.push(`(${escapePdfText(text)}) Tj`);
  commands.push("ET");
}

function newPage(document: ReportCanvasDocument, pageNumber: number): {
  commands: string[];
  cursorY: number;
} {
  const commands: string[] = [];

  commands.push("0.08 0.1 0.14 rg");
  pushText(commands, "AIOps Prime Report Canvas", PAGE_MARGIN, PAGE_HEIGHT - PAGE_MARGIN, 16);

  commands.push("0.25 0.29 0.34 rg");
  pushText(
    commands,
    `Generated: ${document.generatedAt}`,
    PAGE_MARGIN,
    PAGE_HEIGHT - PAGE_MARGIN - 18,
    10,
  );
  pushText(
    commands,
    `Project: ${document.sourceProjectName ?? "All projects"}`,
    PAGE_MARGIN,
    PAGE_HEIGHT - PAGE_MARGIN - 32,
    10,
  );
  pushText(
    commands,
    `Page ${pageNumber}`,
    PAGE_WIDTH - PAGE_MARGIN - 40,
    PAGE_HEIGHT - PAGE_MARGIN - 18,
    10,
  );

  return {
    commands,
    cursorY: PAGE_HEIGHT - PAGE_MARGIN - HEADER_HEIGHT,
  };
}

export function sanitizePdfFilename(filename: string): string {
  const cleaned = filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
  const fallback = cleaned.length > 0 ? cleaned : "aiops-prime-report.pdf";
  return fallback.toLowerCase().endsWith(".pdf") ? fallback : `${fallback}.pdf`;
}

export function renderCanvasPdf(document: ReportCanvasDocument): Uint8Array {
  const pageStreams: string[] = [];
  let page = newPage(document, 1);

  for (const block of document.blocks) {
    const titleLines = wrapText(block.title, 70);
    const contentLines = toBodyLines(block);
    const chunks = chunkLines(contentLines, MAX_BODY_LINES_PER_BLOCK);

    chunks.forEach((chunk, chunkIndex) => {
      const title =
        chunkIndex === 0 ? titleLines.join(" ") : `${titleLines.join(" ")} (cont.)`;
      const blockHeight =
        BLOCK_PADDING * 2 + TITLE_LINE_HEIGHT + chunk.length * BODY_LINE_HEIGHT;

      if (page.cursorY - blockHeight < PAGE_MARGIN) {
        pageStreams.push(page.commands.join("\n"));
        page = newPage(document, pageStreams.length + 1);
      }

      const blockTop = page.cursorY;
      const blockBottom = blockTop - blockHeight;

      page.commands.push("0.96 0.97 0.99 rg");
      page.commands.push("0.77 0.8 0.86 RG");
      page.commands.push("1 w");
      page.commands.push(`${PAGE_MARGIN} ${blockBottom} ${CONTENT_WIDTH} ${blockHeight} re B`);

      page.commands.push("0.11 0.13 0.17 rg");
      pushText(
        page.commands,
        title,
        PAGE_MARGIN + BLOCK_PADDING,
        blockTop - BLOCK_PADDING - 2,
        12,
      );

      page.commands.push("0.2 0.24 0.3 rg");
      let lineY = blockTop - BLOCK_PADDING - TITLE_LINE_HEIGHT;
      for (const line of chunk) {
        pushText(page.commands, line, PAGE_MARGIN + BLOCK_PADDING, lineY, 10);
        lineY -= BODY_LINE_HEIGHT;
      }

      page.cursorY = blockBottom - BLOCK_GAP;
    });
  }

  pageStreams.push(page.commands.join("\n"));

  const pageObjectStart = 3;
  const pageObjectIds = pageStreams.map((_, index) => pageObjectStart + index * 2);
  const contentObjectIds = pageStreams.map((_, index) => pageObjectStart + index * 2 + 1);
  const fontObjectId = pageObjectStart + pageStreams.length * 2;

  const objects = new Array<string>(fontObjectId);
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageObjectIds.length} >>`;

  for (let index = 0; index < pageStreams.length; index += 1) {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = contentObjectIds[index];
    const streamBody = pageStreams[index];
    const stream = `<< /Length ${streamBody.length} >>\nstream\n${streamBody}\nendstream`;

    objects[pageObjectId - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId - 1] = stream;
  }

  objects[fontObjectId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
