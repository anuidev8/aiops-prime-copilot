import sampleLogs from "./sample-logs.json";
import { TimeWindow } from "../../domain/common/value-objects/time-window";

export interface MockTelemetryLog {
  id: string;
  timestamp: string;
  service: string;
  severity: string;
  message: string;
  attributes?: Record<string, string | number | boolean | undefined>;
}

export interface FetchTelemetryLogsParams {
  services?: string[];
  timeWindow?: TimeWindow;
}

export class MockTelemetryApi {
  constructor(private readonly logs: MockTelemetryLog[] = sampleLogs as MockTelemetryLog[]) {}

  async fetchLogs(params: FetchTelemetryLogsParams): Promise<MockTelemetryLog[]> {
    const serviceSet = new Set(
      (params.services ?? []).map((service) => service.trim().toLowerCase()),
    );
    const hasServiceFilter = serviceSet.size > 0;

    return this.logs
      .filter((log) => {
        if (!params.timeWindow) return true;
        return params.timeWindow.includes(new Date(log.timestamp));
      })
      .filter((log) =>
        hasServiceFilter ? serviceSet.has(log.service.trim().toLowerCase()) : true,
      )
      .sort(
        (left, right) =>
          new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
      );
  }
}

