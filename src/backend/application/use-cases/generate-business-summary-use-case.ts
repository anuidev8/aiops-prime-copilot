import { PrimeReportDto } from "../contracts/analyze-logs";

export class GenerateBusinessSummaryUseCase {
  execute(report: PrimeReportDto): string {
    const headlineKpi = report.kpis[0];

    if (!headlineKpi) {
      return report.businessSummary;
    }

    return [
      `Headline KPI: ${headlineKpi.name} is ${headlineKpi.value} ${headlineKpi.unit}.`,
      report.businessSummary,
    ].join(" ");
  }
}
