import { randomUUID } from "crypto";
import { TelemetryAgent } from "../contracts/agent-ports";
import { AnalyzeLogsCommand } from "../contracts/analyze-logs";
import { ProjectOwnershipRepository } from "../../domain/project-analytics/ports/project-ownership-repository";
import {
  buildQuery,
  resolveAnalyzedServices,
  resolveScope,
  resolveTimeWindow,
} from "../shared/analysis-scope";
import { resolveHierarchicalScope } from "../shared/hierarchical-scope-resolver";
import { buildUiBlocks, toIncidentDto } from "../shared/analysis-mappers";
import { buildWorkspaceTelemetryMetrics } from "@/shared/lib/build-workspace-telemetry-metrics";
import { inMemoryArtifactStore } from "../../infrastructure/session/in-memory-artifact-store";
import {
  AgentToolCachePatch,
  AgentToolResult,
  RunTelemetryAgentData,
} from "@/shared/types/agent-tool-response";

export class RunTelemetryUseCase {
  constructor(
    private readonly telemetryAgent: TelemetryAgent,
    private readonly ownershipRepository?: ProjectOwnershipRepository,
  ) {}

  async execute(command: AnalyzeLogsCommand): Promise<AgentToolResult<RunTelemetryAgentData>> {
    try {
      const scope = resolveScope(command);
      const hierarchy = await resolveHierarchicalScope(scope, this.ownershipRepository);
      const incidents = await this.telemetryAgent.detectIncidents({
        serviceNames: hierarchy.hasExplicitServiceScope
          ? hierarchy.serviceNames
          : undefined,
        timeWindow: scope.requestedTimeWindow,
      });

      const resolvedTimeWindow = resolveTimeWindow({
        incidents,
        requestedTimeWindow: scope.requestedTimeWindow,
      });
      const analyzedServices = resolveAnalyzedServices({
        incidents,
        requestedServices: hierarchy.hasExplicitServiceScope
          ? hierarchy.serviceNames
          : scope.requestedServices,
      });
      const query = buildQuery({
        scope,
        analyzedServices,
        resolvedTimeWindow,
        resolvedHierarchy: hierarchy,
      });
      const incidentDtos = incidents.map((incident) => toIncidentDto(incident));
      const runId = randomUUID();
      const resolvedServiceCount =
        query.resolvedServiceCount ?? analyzedServices.length;

      const workspaceMetrics = buildWorkspaceTelemetryMetrics({
        incidents: incidentDtos,
        query,
        resolvedServiceCount,
      });

      inMemoryArtifactStore.saveTelemetry(runId, query, incidents);

      const cachePatch: AgentToolCachePatch = {
        query,
        incidents: incidentDtos,
        analyses: [],
        primeReport: null,
        workspaceMetrics,
      };

      return {
        ok: true,
        data: { query, incidents: incidentDtos, workspaceMetrics },
        cachePatch,
        ui: buildUiBlocks({ incidentDtos }),
        runId,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "TOOL_EXECUTION_FAILED",
          message:
            error instanceof Error ? error.message : "Telemetry agent failed unexpectedly.",
          suggestAction: "retry",
        },
      };
    }
  }
}
