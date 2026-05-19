import { Incident } from "../../domain/observability/entities/incident";
import { Analysis } from "../../domain/aiops-analysis/entities/analysis";
import { AnalyzeLogsResult } from "../../application/contracts/analyze-logs";

interface StoredRun {
  query: AnalyzeLogsResult["query"];
  incidents: Incident[];
  analyses: Analysis[];
  updatedAt: string;
}

const runs = new Map<string, StoredRun>();

export const inMemoryArtifactStore = {
  saveTelemetry(runId: string, query: AnalyzeLogsResult["query"], incidents: Incident[]): void {
    runs.set(runId, {
      query,
      incidents,
      analyses: [],
      updatedAt: new Date().toISOString(),
    });
  },

  saveAnalyses(runId: string, analyses: Analysis[]): void {
    const current = runs.get(runId);
    if (!current) return;
    runs.set(runId, {
      ...current,
      analyses,
      updatedAt: new Date().toISOString(),
    });
  },

  get(runId: string): StoredRun | undefined {
    return runs.get(runId);
  },
};
