import { PrimeReporterAgent } from "../contracts/agent-ports";
import { AnalysisDto, AnalyzeLogsResult, IncidentDto } from "../contracts/analyze-logs";
import { inMemoryArtifactStore } from "../../infrastructure/session/in-memory-artifact-store";
import { resolveTimeWindow } from "../shared/analysis-scope";
import { buildUiBlocks, toIncidentDto, toPrimeReportDto } from "../shared/analysis-mappers";
import {
  AgentToolCachePatch,
  AgentToolResult,
  RunReporterAgentData,
} from "@/shared/types/agent-tool-response";

export interface RunReporterCommand {
  runId?: string;
  useCachedAnalysis?: boolean;
  allowEmptyReport?: boolean;
  /** Fallback when server store is cold but client has cache. */
  cacheQuery?: RunReporterCacheSnapshot["query"];
  cacheIncidents?: IncidentDto[];
  cacheAnalyses?: AnalysisDto[];
}

export interface RunReporterCacheSnapshot {
  query: AnalyzeLogsResult["query"] | null;
  incidents: IncidentDto[];
  analyses: AnalysisDto[];
}

export class RunReporterUseCase {
  constructor(private readonly reporterAgent: PrimeReporterAgent) {}

  async execute(command: RunReporterCommand): Promise<AgentToolResult<RunReporterAgentData>> {
    const useCachedAnalysis = command.useCachedAnalysis ?? true;
    const allowEmptyReport = command.allowEmptyReport ?? false;

    const stored = command.runId ? inMemoryArtifactStore.get(command.runId) : undefined;
    const incidents = stored?.incidents ?? [];
    const analyses = stored?.analyses ?? [];
    const query = stored?.query ?? command.cacheQuery ?? null;
    const incidentCount = incidents.length || (command.cacheIncidents?.length ?? 0);

    if (useCachedAnalysis && !query && incidentCount === 0) {
      return {
        ok: false,
        error: {
          code: "REPORTER_CACHE_EMPTY",
          message:
            "Session cache is empty. Run telemetry or a full analysis before generating a PRIME report from cache.",
          suggestAction: "runTelemetryAgent",
        },
      };
    }

    if (incidentCount === 0 && !allowEmptyReport) {
      return {
        ok: false,
        error: {
          code: "REPORTER_NO_INCIDENTS",
          message:
            "No incidents available for PRIME reporting. Run telemetry first, or confirm generating an empty executive report.",
          suggestAction: "confirmEmptyReport",
        },
      };
    }

    if (incidents.length === 0) {
      return {
        ok: false,
        error: {
          code: "TOOL_EXECUTION_FAILED",
          message:
            "Server session expired. Re-run telemetry before generating a PRIME report from cache.",
          suggestAction: "runTelemetryAgent",
        },
      };
    }

    try {
      const resolvedTimeWindow = resolveTimeWindow({
        incidents,
        requestedTimeWindow: undefined,
      });

      const primeReport = await this.reporterAgent.buildPrimeReport({
        incidents,
        analyses,
        timeWindow: resolvedTimeWindow,
        scopeContext: {
          requestedCompanyId: query?.requestedCompanyId ?? null,
          requestedProjectId: query?.requestedProjectId ?? null,
          resolvedCompanyId: query?.resolvedCompanyId ?? null,
          resolvedProjectId: query?.resolvedProjectId ?? null,
          resolvedProjectName: query?.resolvedProjectName ?? null,
          analyzedServices:
            query?.analyzedServices ??
            Array.from(new Set(incidents.map((incident) => incident.service.value()))),
          resolvedServiceCount:
            query?.resolvedServiceCount ??
            Array.from(new Set(incidents.map((incident) => incident.service.value())))
              .length,
        },
      });

      const primeReportDto = toPrimeReportDto(primeReport);
      const incidentDtos = incidents.map((incident) => toIncidentDto(incident));

      const cachePatch: AgentToolCachePatch = {
        primeReport: primeReportDto,
      };

      return {
        ok: true,
        data: { primeReport: primeReportDto },
        cachePatch,
        ui: buildUiBlocks({ incidentDtos, primeReportDto }),
        runId: command.runId ?? "",
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "TOOL_EXECUTION_FAILED",
          message:
            error instanceof Error ? error.message : "Reporter agent failed unexpectedly.",
          suggestAction: "retry",
        },
      };
    }
  }
}
