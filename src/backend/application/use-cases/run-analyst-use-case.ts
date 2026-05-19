import { randomUUID } from "crypto";
import { Analysis } from "../../domain/aiops-analysis/entities/analysis";
import { Incident } from "../../domain/observability/entities/incident";
import { TimeWindow } from "../../domain/common/value-objects/time-window";
import { AIOpsAnalystAgent, TelemetryAgent } from "../contracts/agent-ports";
import { inMemoryArtifactStore } from "../../infrastructure/session/in-memory-artifact-store";
import { buildUiBlocks, toAnalysisDto, toIncidentDto } from "../shared/analysis-mappers";
import {
  AgentToolCachePatch,
  AgentToolFailure,
  AgentToolResult,
  RunAnalystAgentData,
} from "@/shared/types/agent-tool-response";
import { AnalyzeLogsResult } from "../contracts/analyze-logs";

export interface RunAnalystCommand {
  runId?: string;
  incidentIds?: string[];
  /** Rehydrate server session from prior scope when store is cold. */
  cacheQuery?: AnalyzeLogsResult["query"];
}

export class RunAnalystUseCase {
  constructor(
    private readonly analystAgent: AIOpsAnalystAgent,
    private readonly telemetryAgent: TelemetryAgent,
  ) {}

  async execute(command: RunAnalystCommand): Promise<AgentToolResult<RunAnalystAgentData>> {
    const stored = command.runId ? inMemoryArtifactStore.get(command.runId) : undefined;
    let incidents: Incident[] = stored?.incidents ?? [];
    let runId = command.runId ?? "";

    if (incidents.length === 0 && command.cacheQuery) {
      const scope = command.cacheQuery;
      incidents = await this.telemetryAgent.detectIncidents({
        serviceNames: scope.requestedServices.length
          ? scope.requestedServices
          : scope.analyzedServices.length
            ? scope.analyzedServices
            : undefined,
        timeWindow:
          scope.requestedTimeWindowMinutes !== null
            ? TimeWindow.lastMinutes(scope.requestedTimeWindowMinutes)
            : undefined,
      });
      runId = runId || randomUUID();
      inMemoryArtifactStore.saveTelemetry(runId, scope, incidents);
    }

    if (incidents.length === 0) {
      const failure: AgentToolFailure = {
        ok: false,
        error: {
          code: "ANALYST_NO_INCIDENTS",
          message:
            "No incidents in session cache. Run telemetry first to detect incidents before root-cause analysis.",
          suggestAction: "runTelemetryAgent",
        },
      };
      return failure;
    }

    if (command.incidentIds?.length) {
      const idSet = new Set(command.incidentIds);
      incidents = incidents.filter((incident) => idSet.has(incident.id));
    }

    if (incidents.length === 0) {
      return {
        ok: false,
        error: {
          code: "ANALYST_NO_INCIDENTS",
          message: "No matching incidents found for the requested incidentIds.",
          suggestAction: "runTelemetryAgent",
        },
      };
    }

    try {
      const analyses: Analysis[] = await this.analystAgent.analyzeIncidents({ incidents });
      const analysisDtos = analyses.map((analysis) => toAnalysisDto(analysis));
      const incidentDtos = incidents.map((incident) => toIncidentDto(incident));

      if (command.runId) {
        inMemoryArtifactStore.saveAnalyses(command.runId, analyses);
      }

      const cachePatch: AgentToolCachePatch = {
        analyses: analysisDtos,
        primeReport: null,
      };

      return {
        ok: true,
        data: { analyses: analysisDtos },
        cachePatch,
        ui: buildUiBlocks({ incidentDtos, analysisDtos }),
        runId,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "TOOL_EXECUTION_FAILED",
          message:
            error instanceof Error ? error.message : "Analyst agent failed unexpectedly.",
          suggestAction: "retry",
        },
      };
    }
  }
}
