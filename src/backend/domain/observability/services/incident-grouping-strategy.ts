import { LogEntry } from "../entities/log-entry";

export interface IncidentGroupingStrategy {
  keyFor(log: LogEntry): string;
}

export class GroupByServiceStrategy implements IncidentGroupingStrategy {
  keyFor(log: LogEntry): string {
    return `service:${log.service.value()}`;
  }
}

export class GroupByServiceRegionAndErrorCodeStrategy
  implements IncidentGroupingStrategy
{
  keyFor(log: LogEntry): string {
    const region = log.attributes.region ?? "global";
    const errorCode = log.attributes.errorCode ?? "generic";

    return [
      `service:${log.service.value()}`,
      `region:${region}`,
      `error:${errorCode}`,
    ].join("|");
  }
}
