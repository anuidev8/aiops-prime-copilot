import { NextResponse } from "next/server";
import { createAnalyzeLogsUseCase } from "@/backend/infrastructure/bootstrap";
import { analyzeLogsRequestSchema } from "@/backend/interface/http/analyze-request-schema";

export const dynamic = "force-dynamic";

const analyzeLogsUseCase = createAnalyzeLogsUseCase();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = analyzeLogsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await analyzeLogsUseCase.execute(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to analyze logs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
