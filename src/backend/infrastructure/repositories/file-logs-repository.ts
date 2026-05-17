import sampleLogs from "../data/sample-logs.json";
import { TimeWindow } from "../../domain/common/value-objects/time-window";
import { LogEntry, LogAttributes } from "../../domain/observability/entities/log-entry";
import { LogsRepository } from "../../domain/observability/ports/logs-repository";
import { ServiceName } from "../../domain/common/value-objects/service-name";
import { Severity } from "../../domain/common/value-objects/severity";

interface RawLogEntry {
  id: string;
  timestamp: string;
  service: string;
  severity: string;
  message: string;
  attributes?: LogAttributes;
}

export class FileLogsRepository implements LogsRepository {
  private readonly logs: RawLogEntry[];

  constructor(logs: RawLogEntry[] = sampleLogs as RawLogEntry[]) {
    this.logs = logs;
  }

  async listLogs(params: {
    timeWindow?: TimeWindow;
    serviceNames?: string[];
  }): Promise<LogEntry[]> {
    const serviceSet = new Set(
      (params.serviceNames ?? []).map((service) => service.trim().toLowerCase()),
    );

    const hasServiceFilter = serviceSet.size > 0;

    return this.logs
      .map((log) =>
        new LogEntry(
          log.id,
          new Date(log.timestamp),
          ServiceName.from(log.service),
          Severity.from(log.severity),
          log.message,
          log.attributes ?? {},
        ),
      )
      .filter((log) =>
        params.timeWindow ? params.timeWindow.includes(log.timestamp) : true,
      )
      .filter((log) =>
        hasServiceFilter ? serviceSet.has(log.service.value()) : true,
      );
  }
}
