import { Incident } from "../entities/incident";
import { LogEntry } from "../entities/log-entry";

export class IncidentGroup {
  constructor(
    public readonly key: string,
    public readonly logs: LogEntry[],
    public readonly incident: Incident,
  ) {}
}
