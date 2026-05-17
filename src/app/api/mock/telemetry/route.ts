import { NextResponse } from "next/server";
import { TimeWindow } from "@/backend/domain/common/value-objects/time-window";
import { MockTelemetryApi } from "@/backend/infrastructure/data/mock-telemetry-api";

export const dynamic = "force-dynamic";

const mockTelemetryApi = new MockTelemetryApi();

function parseServices(raw: string | null): string[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((service) => service.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const services = parseServices(url.searchParams.get("services"));
  const rawWindow = url.searchParams.get("timeWindowMinutes");
  const parsedWindow = rawWindow ? Number(rawWindow) : NaN;
  const hasWindow = Number.isFinite(parsedWindow) && parsedWindow >= 1 && parsedWindow <= 1440;
  const timeWindow = hasWindow ? TimeWindow.lastMinutes(Math.floor(parsedWindow)) : undefined;

  const logs = await mockTelemetryApi.fetchLogs({
    services,
    timeWindow,
  });

  return NextResponse.json(
    {
      source: "mock-telemetry-api",
      query: {
        services,
        timeWindowMinutes: hasWindow ? Math.floor(parsedWindow) : null,
      },
      count: logs.length,
      logs,
    },
    { status: 200 },
  );
}

