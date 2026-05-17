import { Severity } from "../../common/value-objects/severity";
import { LogEntry } from "../entities/log-entry";

export interface LogProcessor {
  setNext(next: LogProcessor): LogProcessor;
  process(logs: LogEntry[]): LogEntry[];
}

abstract class BaseLogProcessor implements LogProcessor {
  private nextProcessor: LogProcessor | null = null;

  setNext(next: LogProcessor): LogProcessor {
    this.nextProcessor = next;
    return next;
  }

  process(logs: LogEntry[]): LogEntry[] {
    const current = this.handle(logs);

    if (!this.nextProcessor) {
      return current;
    }

    return this.nextProcessor.process(current);
  }

  protected abstract handle(logs: LogEntry[]): LogEntry[];
}

export class TimestampSorterProcessor extends BaseLogProcessor {
  protected handle(logs: LogEntry[]): LogEntry[] {
    return [...logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export class SeverityNormalizerProcessor extends BaseLogProcessor {
  protected handle(logs: LogEntry[]): LogEntry[] {
    return logs.map((log) =>
      new LogEntry(
        log.id,
        log.timestamp,
        log.service,
        Severity.from(log.severity.value()),
        log.message,
        log.attributes,
      ),
    );
  }
}

export class NoiseFilterProcessor extends BaseLogProcessor {
  protected handle(logs: LogEntry[]): LogEntry[] {
    return logs.filter((log) => {
      const message = log.message.toLowerCase();
      const isNoise =
        message.includes("health check") ||
        message.includes("liveness probe") ||
        message.includes("readiness probe");

      return !isNoise;
    });
  }
}
