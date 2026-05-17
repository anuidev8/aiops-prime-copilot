import { NextResponse } from "next/server";
import { buildRuntimeStatus } from "@/backend/infrastructure/config/runtime-status";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await buildRuntimeStatus();
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load runtime status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
