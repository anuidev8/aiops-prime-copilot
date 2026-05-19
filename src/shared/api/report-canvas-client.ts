import { ReportCanvasDocument } from "@/shared/types/report-canvas";

export async function downloadReportCanvasPdf(
  document: ReportCanvasDocument,
  filename = "aiops-prime-report.pdf",
): Promise<void> {
  const response = await fetch("/api/aiops/report-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      document,
      filename,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string; message?: string };
    throw new Error(error.message ?? error.error ?? "Failed to generate PDF");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
