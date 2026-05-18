import { AnalyzeLogsResult } from "@/shared/types/aiops";

const EMPTY_REPORT: AnalyzeLogsResult["primeReport"] = {
  generatedAt: "",
  narrative: "",
  businessSummary: "",
  kpis: [],
};

export function mergeAnalysisSnapshot(
  current: AnalyzeLogsResult | null,
  snapshot: Partial<AnalyzeLogsResult>,
): AnalyzeLogsResult | null {
  if (!current && !snapshot.query && !snapshot.incidents?.length) {
    return null;
  }

  return {
    query:
      snapshot.query ??
      current?.query ?? {
        requestedServices: [],
        analyzedServices: [],
        requestedTimeWindowMinutes: null,
        resolvedTimeWindowMinutes: 0,
        resolvedWindowFrom: new Date(0).toISOString(),
        resolvedWindowTo: new Date(0).toISOString(),
      },
    incidents: snapshot.incidents ?? current?.incidents ?? [],
    analyses: snapshot.analyses ?? current?.analyses ?? [],
    primeReport: snapshot.primeReport ?? current?.primeReport ?? EMPTY_REPORT,
    ui: current?.ui ?? [],
  };
}
