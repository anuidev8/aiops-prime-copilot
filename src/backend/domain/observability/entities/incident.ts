import { ServiceName } from "../../common/value-objects/service-name";
import { Severity } from "../../common/value-objects/severity";
import { LogEntry } from "./log-entry";

export type IncidentStatus = "open" | "investigating" | "mitigated" | "closed";

export class Incident {
  constructor(
    public readonly id: string,
    public readonly service: ServiceName,
    public readonly fingerprint: string,
    public readonly severity: Severity,
    public readonly startedAt: Date,
    public readonly endedAt: Date,
    public readonly logs: LogEntry[],
    public readonly status: IncidentStatus = "open",
  ) {}

  durationMinutes(): number {
    return Math.max(1, (this.endedAt.getTime() - this.startedAt.getTime()) / 60_000);
  }

  isAutoHandleable(): boolean {
    return this.severity.isAtLeast(Severity.high()) === false && this.logs.length <= 12;
  }
}
