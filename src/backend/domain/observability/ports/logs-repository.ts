import { TimeWindow } from "../../common/value-objects/time-window";
import { LogEntry } from "../entities/log-entry";

export interface LogsRepository {
  listLogs(params: {
    timeWindow?: TimeWindow;
    serviceNames?: string[];
  }): Promise<LogEntry[]>;
}
