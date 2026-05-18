import { AnalysisProgressEvent } from "@/shared/types/analysis-progress";

export type AnalyzeLogsProgressReporter = (event: AnalysisProgressEvent) => void;
