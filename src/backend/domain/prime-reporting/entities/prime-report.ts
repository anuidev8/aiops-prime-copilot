import { TimeWindow } from "../../common/value-objects/time-window";
import { PrimeKpi } from "./prime-kpi";

export class PrimeReport {
  constructor(
    public readonly generatedAt: Date,
    public readonly timeWindow: TimeWindow,
    public readonly kpis: PrimeKpi[],
    public readonly narrative: string,
    public readonly businessSummary: string,
  ) {}
}
