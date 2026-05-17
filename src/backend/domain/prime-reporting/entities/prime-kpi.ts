export type PrimeKpiTrend = "up" | "down" | "flat";

export class PrimeKpi {
  constructor(
    public readonly name: string,
    public readonly value: number,
    public readonly unit: string,
    public readonly trend: PrimeKpiTrend,
    public readonly description: string,
  ) {}
}
