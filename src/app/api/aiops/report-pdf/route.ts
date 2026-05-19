import { NextResponse } from "next/server";
import { z } from "zod";
import {
  renderCanvasPdf,
  sanitizePdfFilename,
} from "@/shared/lib/report-pdf";

export const dynamic = "force-dynamic";

const reportCanvasBlockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("text"),
    title: z.string(),
    content: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("chart"),
    title: z.string(),
    metricName: z.string(),
    value: z.number(),
    unit: z.string(),
    trend: z.enum(["up", "down", "flat"]),
    note: z.string(),
    visual: z
      .object({
        kind: z.enum(["kpi", "bars", "ring", "trend"]),
        maxValue: z.number().optional(),
        series: z
          .array(
            z.object({
              id: z.string(),
              label: z.string(),
              value: z.number(),
              secondaryValue: z.number().optional(),
            }),
          )
          .optional(),
      })
      .optional(),
  }),
]);

const requestSchema = z.object({
  filename: z.string().optional(),
  document: z.object({
    id: z.string(),
    generatedAt: z.string(),
    sourceProjectId: z.string().nullable(),
    sourceProjectName: z.string().nullable(),
    blocks: z.array(reportCanvasBlockSchema).min(1),
  }),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report canvas payload for PDF export." },
      { status: 400 },
    );
  }

  const filename = sanitizePdfFilename(parsed.data.filename ?? "aiops-prime-report.pdf");
  const pdf = renderCanvasPdf(parsed.data.document);
  const pdfBuffer = pdf.buffer.slice(
    pdf.byteOffset,
    pdf.byteOffset + pdf.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
