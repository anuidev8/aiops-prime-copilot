import { Severity } from "../../common/value-objects/severity";
import { IncidentGroup } from "../aggregates/incident-group";
import { Incident } from "../entities/incident";
import { LogEntry } from "../entities/log-entry";
import {
  GroupByServiceRegionAndErrorCodeStrategy,
  IncidentGroupingStrategy,
} from "./incident-grouping-strategy";
import {
  LogProcessor,
  NoiseFilterProcessor,
  SeverityNormalizerProcessor,
  TimestampSorterProcessor,
} from "./log-processing-chain";

export class IncidentDetector {
  constructor(
    private readonly groupingStrategy: IncidentGroupingStrategy =
      new GroupByServiceRegionAndErrorCodeStrategy(),
    private readonly processingChain: LogProcessor = IncidentDetector.defaultChain(),
  ) {}

  private static defaultChain(): LogProcessor {
    const sorter = new TimestampSorterProcessor();
    const severityNormalizer = new SeverityNormalizerProcessor();
    const noiseFilter = new NoiseFilterProcessor();

    sorter.setNext(severityNormalizer).setNext(noiseFilter);
    return sorter;
  }

  detect(logs: LogEntry[]): IncidentGroup[] {
    const preparedLogs = this.processingChain.process(logs);
    const buckets = new Map<string, LogEntry[]>();

    for (const log of preparedLogs) {
      const key = this.groupingStrategy.keyFor(log);
      const existing = buckets.get(key);

      if (existing) {
        existing.push(log);
      } else {
        buckets.set(key, [log]);
      }
    }

    const incidentGroups: IncidentGroup[] = [];

    for (const [key, groupedLogs] of buckets.entries()) {
      if (groupedLogs.length === 0) continue;

      const startedAt = groupedLogs[0].timestamp;
      const endedAt = groupedLogs[groupedLogs.length - 1].timestamp;

      const severity = groupedLogs.reduce(
        (acc, log) => (log.severity.isGreaterThan(acc) ? log.severity : acc),
        Severity.low(),
      );

      const incident = new Incident(
        `inc-${Math.abs(hashCode(key))}`,
        groupedLogs[0].service,
        key,
        severity,
        startedAt,
        endedAt,
        groupedLogs,
      );

      incidentGroups.push(new IncidentGroup(key, groupedLogs, incident));
    }

    return incidentGroups;
  }
}

function hashCode(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}
