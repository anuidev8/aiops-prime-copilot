import { FunctionTool } from "@google/adk";
import { z } from "zod";
import { TimeWindow } from "../../domain/common/value-objects/time-window";
import { ServiceName } from "../../domain/common/value-objects/service-name";
import { Severity } from "../../domain/common/value-objects/severity";
import { Incident } from "../../domain/observability/entities/incident";
import { LogEntry } from "../../domain/observability/entities/log-entry";
import { IncidentDetector } from "../../domain/observability/services/incident-detector";
import { TelemetryAgent } from "../../application/contracts/agent-ports";
import { MockTelemetryApi, MockTelemetryLog } from "../data/mock-telemetry-api";

const telemetryToolArgsSchema = z.object({
  timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
  services: z.array(z.string()).optional(),
  fromIso: z.string().optional(),
  toIso: z.string().optional(),
});

type TelemetryToolArgs = z.infer<typeof telemetryToolArgsSchema>;

interface TelemetryToolIncidentSummary {
  id: string;
  service: string;
  severity: string;
  count: number;
  startedAt: string;
  endedAt: string;
  fingerprint: string;
  sampleMessages: string[];
}

interface TelemetryToolServiceSummary {
  service: string;
  incidents: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface TelemetryToolExecutionResult {
  scope: {
    services: string[];
    timeWindowMinutes: number | null;
    from: string | null;
    to: string | null;
    logCount: number;
  };
  incidents: Incident[];
  incidentSummaries: TelemetryToolIncidentSummary[];
  serviceSummaries: TelemetryToolServiceSummary[];
}

export class AdkTelemetryAgent implements TelemetryAgent {
  readonly telemetryTool: FunctionTool<typeof telemetryToolArgsSchema>;

  constructor(
    private readonly incidentDetector: IncidentDetector,
    private readonly telemetryApi: MockTelemetryApi = new MockTelemetryApi(),
  ) {
    this.telemetryTool = new FunctionTool({
      name: "telemetry_tool",
      description:
        "Read telemetry logs, group them into incidents, and summarize per service/time window.",
      parameters: telemetryToolArgsSchema,
      execute: async (args) => this.runTelemetryTool(args),
    });
  }

  async detectIncidents(input: {
    serviceNames?: string[];
    timeWindow?: TimeWindow;
  }): Promise<Incident[]> {
    const services = (input.serviceNames ?? [])
      .map((service) => service.trim().toLowerCase())
      .filter(Boolean);

    const toolArgs: TelemetryToolArgs = {
      services: services.length > 0 ? services : undefined,
      timeWindowMinutes: input.timeWindow
        ? Math.max(1, Math.round(input.timeWindow.durationMinutes()))
        : undefined,
      fromIso: input.timeWindow?.from.toISOString(),
      toIso: input.timeWindow?.to.toISOString(),
    };

    const result = await this.runTelemetryTool(toolArgs);
    return result.incidents;
  }

  private async runTelemetryTool(args: TelemetryToolArgs): Promise<TelemetryToolExecutionResult> {
    const services = (args.services ?? [])
      .map((service) => service.trim().toLowerCase())
      .filter(Boolean);

    const timeWindow = this.resolveTimeWindow(args);

    const rawLogs = await this.telemetryApi.fetchLogs({
      services,
      timeWindow,
    });
    const logs = rawLogs.map((log) => this.toLogEntry(log));
    const incidentGroups = this.incidentDetector.detect(logs);
    const incidents = incidentGroups.map((group) => group.incident);

    return {
      scope: {
        services,
        timeWindowMinutes: args.timeWindowMinutes ?? null,
        from: timeWindow ? timeWindow.from.toISOString() : null,
        to: timeWindow ? timeWindow.to.toISOString() : null,
        logCount: logs.length,
      },
      incidents,
      incidentSummaries: incidents.map((incident) => ({
        id: incident.id,
        service: incident.service.value(),
        severity: incident.severity.value(),
        count: incident.logs.length,
        startedAt: incident.startedAt.toISOString(),
        endedAt: incident.endedAt.toISOString(),
        fingerprint: incident.fingerprint,
        sampleMessages: incident.logs.slice(0, 3).map((log) => log.message),
      })),
      serviceSummaries: this.summarizeByService(incidents),
    };
  }

  private toLogEntry(log: MockTelemetryLog): LogEntry {
    return new LogEntry(
      log.id,
      new Date(log.timestamp),
      ServiceName.from(log.service),
      Severity.from(log.severity),
      log.message,
      log.attributes ?? {},
    );
  }

  private resolveTimeWindow(args: TelemetryToolArgs): TimeWindow | undefined {
    if (args.fromIso && args.toIso) {
      const from = new Date(args.fromIso);
      const to = new Date(args.toIso);

      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
        return new TimeWindow(from, to);
      }
    }

    if (args.timeWindowMinutes === undefined) {
      return undefined;
    }

    return TimeWindow.lastMinutes(args.timeWindowMinutes);
  }

  private summarizeByService(incidents: Incident[]): TelemetryToolServiceSummary[] {
    const summary = new Map<string, TelemetryToolServiceSummary>();

    for (const incident of incidents) {
      const service = incident.service.value();
      const current = summary.get(service) ?? {
        service,
        incidents: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      current.incidents += 1;
      current[incident.severity.value()] += 1;
      summary.set(service, current);
    }

    return Array.from(summary.values()).sort((left, right) =>
      left.service.localeCompare(right.service),
    );
  }
}
