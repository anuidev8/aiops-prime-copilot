import { ServiceName } from "../../common/value-objects/service-name";
import { Severity } from "../../common/value-objects/severity";

export interface LogAttributes {
  region?: string;
  host?: string;
  traceId?: string;
  errorCode?: string;
  [key: string]: string | number | boolean | undefined;
}

export class LogEntry {
  constructor(
    public readonly id: string,
    public readonly timestamp: Date,
    public readonly service: ServiceName,
    public readonly severity: Severity,
    public readonly message: string,
    public readonly attributes: LogAttributes = {},
  ) {}
}
