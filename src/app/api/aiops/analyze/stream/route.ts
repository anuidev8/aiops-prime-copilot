import { createAnalyzeLogsUseCase } from "@/backend/infrastructure/bootstrap";
import { analyzeLogsRequestSchema } from "@/backend/interface/http/analyze-request-schema";
import { AnalysisProgressEvent } from "@/shared/types/analysis-progress";

export const dynamic = "force-dynamic";

const analyzeLogsUseCase = createAnalyzeLogsUseCase();

function encodeEvent(event: AnalysisProgressEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = analyzeLogsRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const reportProgress = (event: AnalysisProgressEvent) => {
        controller.enqueue(encodeEvent(event));
      };

      analyzeLogsUseCase
        .executeWithProgress(parsed.data, reportProgress)
        .then(() => {
          controller.close();
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encodeEvent({
              type: "error",
              timestamp: new Date().toISOString(),
              message,
            }),
          );
          controller.close();
        });
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
